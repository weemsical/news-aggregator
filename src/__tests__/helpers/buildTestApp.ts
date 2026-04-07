import { createApp } from "../../server/app";
import { TestInMemoryArticleRepository } from "./TestInMemoryArticleRepository";
import { TestInMemoryHighlightRepository } from "./TestInMemoryHighlightRepository";
import { TestInMemoryRawArticleRepository } from "./TestInMemoryRawArticleRepository";
import { TestInMemoryUserRepository } from "./TestInMemoryUserRepository";
import { TestInMemoryFeedSourceRepository } from "./TestInMemoryFeedSourceRepository";

export function buildTestApp() {
  const articles = new TestInMemoryArticleRepository();
  const highlights = new TestInMemoryHighlightRepository();
  const rawArticles = new TestInMemoryRawArticleRepository();
  const users = new TestInMemoryUserRepository();
  const feedSources = new TestInMemoryFeedSourceRepository();
  const app = createApp({ articles, highlights, users, feedSources, rawArticles });
  return { app, articles, highlights, rawArticles, users, feedSources };
}
