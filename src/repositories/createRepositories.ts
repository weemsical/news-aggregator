import { ArticleRepository } from "./ArticleRepository";
import { FlagRepository } from "./FlagRepository";
import { InMemoryArticleRepository } from "./InMemoryArticleRepository";
import { InMemoryFlagRepository } from "./InMemoryFlagRepository";
import { PostgresArticleRepository } from "./PostgresArticleRepository";
import { PostgresFlagRepository } from "./PostgresFlagRepository";
import { getPool } from "../db/pool";

export interface Repositories {
  articles: ArticleRepository;
  flags: FlagRepository;
}

export function createRepositories(): Repositories {
  const databaseUrl = process.env.DATABASE_URL;

  if (databaseUrl) {
    const pool = getPool();
    return {
      articles: new PostgresArticleRepository(pool),
      flags: new PostgresFlagRepository(pool),
    };
  }

  return {
    articles: new InMemoryArticleRepository(),
    flags: new InMemoryFlagRepository(),
  };
}
