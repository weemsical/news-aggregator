import { ArticleRepository } from "./ArticleRepository";
import { FlagRepository } from "./FlagRepository";
import { UserRepository } from "./UserRepository";
import { InMemoryArticleRepository } from "./InMemoryArticleRepository";
import { InMemoryFlagRepository } from "./InMemoryFlagRepository";
import { InMemoryUserRepository } from "./InMemoryUserRepository";
import { PostgresArticleRepository } from "./PostgresArticleRepository";
import { PostgresFlagRepository } from "./PostgresFlagRepository";
import { PostgresUserRepository } from "./PostgresUserRepository";
import { getPool } from "../db/pool";

export interface Repositories {
  articles: ArticleRepository;
  flags: FlagRepository;
  users: UserRepository;
}

export function createRepositories(): Repositories {
  const databaseUrl = process.env.DATABASE_URL;

  if (databaseUrl) {
    const pool = getPool();
    return {
      articles: new PostgresArticleRepository(pool),
      flags: new PostgresFlagRepository(pool),
      users: new PostgresUserRepository(pool),
    };
  }

  return {
    articles: new InMemoryArticleRepository(),
    flags: new InMemoryFlagRepository(),
    users: new InMemoryUserRepository(),
  };
}
