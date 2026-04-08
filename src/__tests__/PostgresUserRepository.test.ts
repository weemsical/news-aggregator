import { Pool } from "pg";
import { userRepositoryContractTests } from "./UserRepository.contract";
import { PostgresUserRepository } from "@repositories";
import { runMigrations } from "../db/migrate";

const describeWithDb = process.env.DATABASE_URL ? describe : describe.skip;

describeWithDb("PostgresUserRepository", () => {
  let pool: Pool;

  beforeAll(async () => {
    pool = new Pool({ connectionString: process.env.DATABASE_URL });
    await runMigrations(pool);
  });

  afterAll(async () => {
    await pool.end();
  });

  userRepositoryContractTests(async () => {
    await pool.query("DELETE FROM users");
    return new PostgresUserRepository(pool);
  });
});
