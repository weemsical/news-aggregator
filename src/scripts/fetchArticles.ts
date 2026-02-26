import * as path from "path";
import { feedSources } from "../data/feedSources";
import { fetchFeed } from "../services/RssFetcher";
import { parseRssFeed } from "../services/RssParser";
import { saveArticles, loadArticles } from "../services/ArticlePersistence";
import { Article } from "../types";

export interface FetchResult {
  totalArticles: number;
  failedSources: string[];
}

export async function runFetchArticles(outputPath: string): Promise<FetchResult> {
  const existing = loadArticles(outputPath);
  const existingIds = new Set(existing.map((a) => a.id));
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
      if (!existingIds.has(article.id)) {
        newArticles.push(article);
        existingIds.add(article.id);
      }
    }
  }

  const merged = [...existing, ...newArticles];
  saveArticles(merged, outputPath);

  return {
    totalArticles: merged.length,
    failedSources,
  };
}

// CLI entry point
const isDirectRun = require.main === module;
if (isDirectRun) {
  const outputPath = path.resolve(__dirname, "../../public/articles.json");
  runFetchArticles(outputPath).then((result) => {
    console.log(`Fetched ${result.totalArticles} total articles.`);
    if (result.failedSources.length > 0) {
      console.error(`Failed sources: ${result.failedSources.join(", ")}`);
      process.exit(1);
    }
  });
}
