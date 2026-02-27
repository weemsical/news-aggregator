import { Pool } from "pg";
import { feedSourceRepositoryContractTests } from "./FeedSourceRepository.contract";
import { PostgresFeedSourceRepository } from "../repositories/PostgresFeedSourceRepository";
import { runMigrations } from "../db/migrate";

const describeWithDb = process.env.DATABASE_URL ? describe : describe.skip;

describeWithDb("PostgresFeedSourceRepository", () => {
  let pool: Pool;

  beforeAll(async () => {
    pool = new Pool({ connectionString: process.env.DATABASE_URL });
    await runMigrations(pool);
  });

  afterAll(async () => {
    await pool.end();
  });

  feedSourceRepositoryContractTests(async () => {
    await pool.query("DELETE FROM feed_sources");
    return new PostgresFeedSourceRepository(pool);
  });
});
