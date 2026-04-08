import express from "express";
import cookieParser from "cookie-parser";
import { ArticleRepository } from "../repositories/ArticleRepository";
import { HighlightRepository } from "../repositories/HighlightRepository";
import { UserRepository } from "../repositories/UserRepository";
import { FeedSourceRepository } from "../repositories/FeedSourceRepository";
import { RawArticleRepository } from "../repositories/RawArticleRepository";
import { articlesRouter } from "./routes/articles";
import { highlightsRouter, highlightActionsRouter } from "./routes/highlights";
import { authRouter } from "./routes/auth";
import { leaderboardRouter } from "./routes/leaderboard";
import { adminRouter } from "./routes/admin";
import { RequestHandler } from "express";

interface AppDeps {
  articles: ArticleRepository;
  highlights: HighlightRepository;
  users: UserRepository;
  feedSources: FeedSourceRepository;
  rawArticles: RawArticleRepository;
  rateLimitMiddleware?: RequestHandler;
}

export function createApp({ articles, highlights, users, feedSources, rawArticles, rateLimitMiddleware }: AppDeps) {
  const app = express();

  app.use(express.json());
  app.use(cookieParser());
  app.use("/api/auth", authRouter(users));
  app.use("/api/articles", articlesRouter(articles));
  app.use("/api/articles/:id/highlights", highlightsRouter(articles, highlights, rateLimitMiddleware));
  app.use("/api/highlights", highlightActionsRouter(highlights));
  app.use("/api/leaderboard", leaderboardRouter());
  app.use("/api/admin", adminRouter(feedSources, articles, users));

  return app;
}
