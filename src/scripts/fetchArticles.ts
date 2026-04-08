import { feedSources, getAllFeedSources } from "@data";
import { fetchFeed, parseRssFeed } from "@services";
import { ArticleRepository, FeedSourceRepository } from "@repositories";
import { Article } from "@types";

export interface FetchResult {
  totalArticles: number;
  failedSources: string[];
}

export async function runFetchArticles(
  repo: ArticleRepository,
  feedSourceRepo?: FeedSourceRepository
): Promise<FetchResult> {
  const sources = feedSourceRepo
    ? await getAllFeedSources(feedSourceRepo)
    : feedSources;

  const failedSources: string[] = [];
  const newArticles: Article[] = [];

  for (const source of sources) {
    const result = await fetchFeed(source.feedUrl);

    if (!result.ok || !result.xml) {
      failedSources.push(source.sourceId);
      continue;
    }

    const articles = parseRssFeed(result.xml, source);
    for (const article of articles) {
      const alreadyExists = await repo.exists(article.id);
      if (!alreadyExists) {
        newArticles.push(article);
      }
    }
  }

  if (newArticles.length > 0) {
    await repo.saveBatch(newArticles);
  }

  const totalArticles = await repo.count();

  return {
    totalArticles,
    failedSources,
  };
}

// CLI entry point
const isDirectRun = require.main === module;
if (isDirectRun) {
  const { createRepositories } = require("../repositories/createRepositories");
  const repos = createRepositories();

  runFetchArticles(repos.articles, repos.feedSources).then((result) => {
    console.log(`Fetched ${result.totalArticles} total articles.`);
    if (result.failedSources.length > 0) {
      console.error(`Failed sources: ${result.failedSources.join(", ")}`);
      process.exit(1);
    }
  });
}
