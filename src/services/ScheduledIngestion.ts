import { ArticleRepository, RawArticleRepository, FeedSourceRepository, ReplacementRuleRepository } from "@repositories";
import { getAllFeedSources } from "@data";
import { NotificationService } from "./NotificationService";
import { IngestionService, FeedResult } from "./IngestionService";

export interface IngestionDeps {
  articles: ArticleRepository;
  rawArticles: RawArticleRepository;
  feedSources: FeedSourceRepository;
  replacementRules: ReplacementRuleRepository;
  notificationService?: NotificationService;
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

async function fetchSingleFeedWithRetry(
  source: { sourceId: string; name: string; feedUrl: string; defaultTags: string[]; publishMode?: "auto" | "manual" },
  deps: IngestionDeps,
  options: IngestionOptions
): Promise<FeedResult> {
  const maxRetries = 3;
  const baseDelay = options.retryDelayMs ?? 1000;

  const serviceDeps = {
    articles: deps.articles,
    rawArticles: deps.rawArticles,
    replacementRules: deps.replacementRules,
  };

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const result = await IngestionService.fetchAndSaveFeed(source, serviceDeps);

    if (result.success) {
      return result;
    }

    // If articles were saved (partial success) or this is the last attempt, return as-is
    if (attempt === maxRetries - 1) {
      return result;
    }

    // Retry with exponential backoff
    if (baseDelay > 0) {
      await sleep(baseDelay * Math.pow(2, attempt));
    }
  }

  return { sourceId: source.sourceId, success: false, articlesSaved: 0, error: "Unknown error" };
}

export class ScheduledIngestion {
  static async runIngestion(deps: IngestionDeps, options: IngestionOptions = {}): Promise<IngestionResult> {
    const allSources = await getAllFeedSources(deps.feedSources);

    // Fetch all feeds in parallel
    const feedResults = await Promise.all(
      allSources.map((source) => fetchSingleFeedWithRetry(source, deps, options))
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
