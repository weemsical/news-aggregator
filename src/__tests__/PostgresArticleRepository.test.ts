import { Pool } from "pg";
import { articleRepositoryContractTests } from "./ArticleRepository.contract";
import { PostgresArticleRepository } from "../repositories/PostgresArticleRepository";
import { runMigrations } from "../db/migrate";

const describeWithDb = process.env.DATABASE_URL ? describe : describe.skip;

describeWithDb("PostgresArticleRepository", () => {
  let pool: Pool;

  beforeAll(async () => {
    pool = new Pool({ connectionString: process.env.DATABASE_URL });
    await runMigrations(pool);
  });

  afterAll(async () => {
    await pool.end();
  });

  articleRepositoryContractTests(async () => {
    await pool.query("DELETE FROM propaganda_flags");
    await pool.query("DELETE FROM articles");
    return new PostgresArticleRepository(pool);
  });
});
