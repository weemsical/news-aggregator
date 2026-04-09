import { ArticleRepository, RawArticleRepository, FeedSourceRepository, ReplacementRuleRepository } from "@repositories";
import { FeedSource, getAllFeedSources } from "@data";
import { fetchFeed } from "./RssFetcher";
import { parseRssFeed } from "./RssParser";
import { ReplacementService } from "./ReplacementService";
import { NotificationService } from "./NotificationService";

export interface IngestionDeps {
  articles: ArticleRepository;
  rawArticles: RawArticleRepository;
  feedSources: FeedSourceRepository;
  replacementRules: ReplacementRuleRepository;
  notificationService?: NotificationService;
}

export interface FeedResult {
  sourceId: string;
  success: boolean;
  articlesSaved: number;
  error?: string;
}

export interface IngestionResult {
  totalArticlesSaved: number;
  feedResults: FeedResult[];
}

interface IngestionOptions {
  retryDelayMs?: number;
}

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchSingleFeed(
  source: FeedSource,
  deps: IngestionDeps,
  options: IngestionOptions
): Promise<FeedResult> {
  const maxRetries = 3;
  const baseDelay = options.retryDelayMs ?? 1000;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const result = await fetchFeed(source.feedUrl);

    if (result.ok && result.xml) {
      const parsedArticles = parseRssFeed(result.xml, source);
      const reviewStatus = source.publishMode === "manual" ? "pending" : "approved";

      const rules = await deps.replacementRules.findBySource(source.sourceId);

      let savedCount = 0;
      for (const article of parsedArticles) {
        const exists = await deps.articles.exists(article.id);
        if (!exists) {
          // Save raw article
          await deps.rawArticles.save({
            id: article.rawArticleId,
            title: article.title,
            body: article.body,
            sourceId: article.sourceId,
            url: article.url,
            fetchedAt: article.fetchedAt,
          });

          // Apply replacement rules
          let processedBody = article.body;
          if (rules.length > 0) {
            const replaced = ReplacementService.applyRules(article.body, rules);
            processedBody = replaced.processed;
          }

          // Save processed article
          await deps.articles.save({
            ...article,
            body: processedBody,
            reviewStatus,
          });
          savedCount++;
        }
      }

      return { sourceId: source.sourceId, success: true, articlesSaved: savedCount };
    }

    // Retry with exponential backoff
    if (attempt < maxRetries - 1 && baseDelay > 0) {
      await sleep(baseDelay * Math.pow(2, attempt));
    }

    // Last attempt failed
    if (attempt === maxRetries - 1) {
      return {
        sourceId: source.sourceId,
        success: false,
        articlesSaved: 0,
        error: result.error ?? "Unknown error",
      };
    }
  }

  return { sourceId: source.sourceId, success: false, articlesSaved: 0, error: "Unknown error" };
}

export class ScheduledIngestion {
  static async runIngestion(deps: IngestionDeps, options: IngestionOptions = {}): Promise<IngestionResult> {
    const allSources = await getAllFeedSources(deps.feedSources);

    // Fetch all feeds in parallel
    const feedResults = await Promise.all(
      allSources.map((source) => fetchSingleFeed(source, deps, options))
    );

    const totalArticlesSaved = feedResults.reduce((sum, r) => sum + r.articlesSaved, 0);

    // Notify for failures
    if (deps.notificationService) {
      for (const result of feedResults) {
        if (!result.success) {
          const source = allSources.find((s) => s.sourceId === result.sourceId);
          await deps.notificationService.notifyFeedFailure(
            result.sourceId,
            source?.name ?? result.sourceId,
            result.error ?? "Unknown error"
          );
        }
      }

      // Notify new articles
      if (totalArticlesSaved > 0) {
        await deps.notificationService.notifyNewArticles(totalArticlesSaved);
      }
    }

    return { totalArticlesSaved, feedResults };
  }
}
