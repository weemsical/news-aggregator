import { feedSources } from "../data/feedSources";
import { fetchFeed } from "../services/RssFetcher";
import { parseRssFeed } from "../services/RssParser";
import { ArticleRepository } from "../repositories/ArticleRepository";
import { Article } from "../types";

export interface FetchResult {
  totalArticles: number;
  failedSources: string[];
}

export async function runFetchArticles(repo: ArticleRepository): Promise<FetchResult> {
  const failedSources: string[] = [];
  const newArticles: Article[] = [];

  for (const source of feedSources) {
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

  runFetchArticles(repos.articles).then((result) => {
    console.log(`Fetched ${result.totalArticles} total articles.`);
    if (result.failedSources.length > 0) {
      console.error(`Failed sources: ${result.failedSources.join(", ")}`);
      process.exit(1);
    }
  });
}
