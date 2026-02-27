import { createRepositories } from "../repositories/createRepositories";
import { InMemoryArticleRepository } from "../repositories/InMemoryArticleRepository";
import { InMemoryFlagRepository } from "../repositories/InMemoryFlagRepository";
import { InMemoryUserRepository } from "../repositories/InMemoryUserRepository";
import { InMemoryFeedSourceRepository } from "../repositories/InMemoryFeedSourceRepository";

describe("createRepositories", () => {
  const originalEnv = process.env.DATABASE_URL;

  afterEach(() => {
    if (originalEnv !== undefined) {
      process.env.DATABASE_URL = originalEnv;
    } else {
      delete process.env.DATABASE_URL;
    }
  });

  it("returns InMemory implementations when DATABASE_URL is not set", () => {
    delete process.env.DATABASE_URL;
    const { articles, flags, users, feedSources } = createRepositories();
    expect(articles).toBeInstanceOf(InMemoryArticleRepository);
    expect(flags).toBeInstanceOf(InMemoryFlagRepository);
    expect(users).toBeInstanceOf(InMemoryUserRepository);
    expect(feedSources).toBeInstanceOf(InMemoryFeedSourceRepository);
  });

  it("returns InMemory implementations when DATABASE_URL is empty", () => {
    process.env.DATABASE_URL = "";
    const { articles, flags, users, feedSources } = createRepositories();
    expect(articles).toBeInstanceOf(InMemoryArticleRepository);
    expect(flags).toBeInstanceOf(InMemoryFlagRepository);
    expect(users).toBeInstanceOf(InMemoryUserRepository);
    expect(feedSources).toBeInstanceOf(InMemoryFeedSourceRepository);
  });
});
