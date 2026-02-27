import express from "express";
import cookieParser from "cookie-parser";
import { ArticleRepository } from "../repositories/ArticleRepository";
import { FlagRepository } from "../repositories/FlagRepository";
import { UserRepository } from "../repositories/UserRepository";
import { FeedSourceRepository } from "../repositories/FeedSourceRepository";
import { articlesRouter } from "./routes/articles";
import { flagsRouter } from "./routes/flags";
import { authRouter } from "./routes/auth";
import { leaderboardRouter } from "./routes/leaderboard";
import { adminRouter } from "./routes/admin";

interface AppDeps {
  articles: ArticleRepository;
  flags: FlagRepository;
  users: UserRepository;
  feedSources: FeedSourceRepository;
}

export function createApp({ articles, flags, users, feedSources }: AppDeps) {
  const app = express();

  app.use(express.json());
  app.use(cookieParser());
  app.use("/api/auth", authRouter(users));
  app.use("/api/articles", articlesRouter(articles));
  app.use("/api/articles/:id/flags", flagsRouter(articles, flags));
  app.use("/api/leaderboard", leaderboardRouter(articles, flags, feedSources));
  app.use("/api/admin", adminRouter(feedSources, articles, users));

  return app;
}
