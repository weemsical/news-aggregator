import { ArticleRepository, RawArticleRepository, ReplacementRuleRepository } from "@repositories";
import { FeedSource } from "@data";
import { fetchFeed } from "./RssFetcher";
import { parseRssFeed } from "./RssParser";
import { ReplacementService } from "./ReplacementService";

export interface IngestionServiceDeps {
  articles: ArticleRepository;
  rawArticles: RawArticleRepository;
  replacementRules: ReplacementRuleRepository;
}

export interface FeedResult {
  sourceId: string;
  success: boolean;
  articlesSaved: number;
  articlesFound?: number;
  error?: string;
}

export class IngestionService {
  static async fetchAndSaveFeed(
    source: FeedSource,
    deps: IngestionServiceDeps
  ): Promise<FeedResult> {
    const result = await fetchFeed(source.feedUrl);

    if (!result.ok || !result.xml) {
      return {
        sourceId: source.sourceId,
        success: false,
        articlesSaved: 0,
        error: result.error ?? "Unknown error",
      };
    }

    try {
      const parsedArticles = parseRssFeed(result.xml, source);
      const reviewStatus = source.publishMode === "manual" ? "pending" : "approved";
      const rules = await deps.replacementRules.findBySource(source.sourceId);

      let savedCount = 0;
      for (const article of parsedArticles) {
        const exists = await deps.articles.exists(article.id);
        if (!exists) {
          const rawArticle = {
            id: article.rawArticleId,
            title: article.title,
            body: article.body,
            sourceId: article.sourceId,
            url: article.url,
            fetchedAt: article.fetchedAt,
          };

          await deps.rawArticles.save(rawArticle);

          try {
            let processedBody = article.body;
            if (rules.length > 0) {
              const replaced = ReplacementService.applyRules(article.body, rules);
              processedBody = replaced.processed;
            }

            await deps.articles.save({
              ...article,
              body: processedBody,
              reviewStatus,
            });
            savedCount++;
          } catch (err) {
            await deps.rawArticles.delete(rawArticle.id);
            throw err;
          }
        }
      }

      return {
        sourceId: source.sourceId,
        success: true,
        articlesSaved: savedCount,
        articlesFound: parsedArticles.length,
      };
    } catch (err) {
      return {
        sourceId: source.sourceId,
        success: false,
        articlesSaved: 0,
        error: err instanceof Error ? err.message : "Unknown error",
      };
    }
  }
}
