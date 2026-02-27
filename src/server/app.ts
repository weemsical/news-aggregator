import express from "express";
import { ArticleRepository } from "../repositories/ArticleRepository";
import { FlagRepository } from "../repositories/FlagRepository";
import { articlesRouter } from "./routes/articles";
import { flagsRouter } from "./routes/flags";

interface AppDeps {
  articles: ArticleRepository;
  flags: FlagRepository;
}

export function createApp({ articles, flags }: AppDeps) {
  const app = express();

  app.use(express.json());
  app.use("/api/articles", articlesRouter(articles));
  app.use("/api/articles/:id/flags", flagsRouter(articles, flags));

  return app;
}
