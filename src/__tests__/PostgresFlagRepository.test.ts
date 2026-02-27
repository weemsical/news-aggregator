import { Pool } from "pg";
import { flagRepositoryContractTests } from "./FlagRepository.contract";
import { PostgresFlagRepository } from "../repositories/PostgresFlagRepository";
import { PostgresArticleRepository } from "../repositories/PostgresArticleRepository";
import { runMigrations } from "../db/migrate";

const describeWithDb = process.env.DATABASE_URL ? describe : describe.skip;

describeWithDb("PostgresFlagRepository", () => {
  let pool: Pool;

  beforeAll(async () => {
    pool = new Pool({ connectionString: process.env.DATABASE_URL });
    await runMigrations(pool);
  });

  afterAll(async () => {
    await pool.end();
  });

  flagRepositoryContractTests(async () => {
    await pool.query("DELETE FROM propaganda_flags");
    await pool.query("DELETE FROM articles");

    // Insert a test article so foreign key constraints are satisfied
    const articleRepo = new PostgresArticleRepository(pool);
    await articleRepo.save({
      id: "article-1",
      title: "Test Article",
      body: ["Test body."],
      sourceTags: ["test"],
      sourceId: "test-source",
      url: "https://example.com/test",
      fetchedAt: 1740000000000,
    });
    await articleRepo.save({
      id: "article-2",
      title: "Test Article 2",
      body: ["Test body 2."],
      sourceTags: ["test"],
      sourceId: "test-source",
      url: "https://example.com/test-2",
      fetchedAt: 1740100000000,
    });

    return new PostgresFlagRepository(pool);
  });
});
