import { RequestHandler } from "express";
import { createApp } from "../../server/app";
import { TestInMemoryArticleRepository } from "./TestInMemoryArticleRepository";
import { TestInMemoryHighlightRepository } from "./TestInMemoryHighlightRepository";
import { TestInMemoryRawArticleRepository } from "./TestInMemoryRawArticleRepository";
import { TestInMemoryUserRepository } from "./TestInMemoryUserRepository";
import { TestInMemoryFeedSourceRepository } from "./TestInMemoryFeedSourceRepository";

interface BuildTestAppOptions {
  rateLimitMiddleware?: RequestHandler;
}

export function buildTestApp(options: BuildTestAppOptions = {}) {
  const articles = new TestInMemoryArticleRepository();
  const highlights = new TestInMemoryHighlightRepository();
  const rawArticles = new TestInMemoryRawArticleRepository();
  const users = new TestInMemoryUserRepository();
  const feedSources = new TestInMemoryFeedSourceRepository();
  const app = createApp({
    articles,
    highlights,
    users,
    feedSources,
    rawArticles,
    rateLimitMiddleware: options.rateLimitMiddleware,
  });
  return { app, articles, highlights, rawArticles, users, feedSources };
}
