import express from "express";
import cookieParser from "cookie-parser";
import { ArticleRepository } from "../repositories/ArticleRepository";
import { FlagRepository } from "../repositories/FlagRepository";
import { UserRepository } from "../repositories/UserRepository";
import { articlesRouter } from "./routes/articles";
import { flagsRouter } from "./routes/flags";
import { authRouter } from "./routes/auth";

interface AppDeps {
  articles: ArticleRepository;
  flags: FlagRepository;
  users: UserRepository;
}

export function createApp({ articles, flags, users }: AppDeps) {
  const app = express();

  app.use(express.json());
  app.use(cookieParser());
  app.use("/api/auth", authRouter(users));
  app.use("/api/articles", articlesRouter(articles));
  app.use("/api/articles/:id/flags", flagsRouter(articles, flags));

  return app;
}
