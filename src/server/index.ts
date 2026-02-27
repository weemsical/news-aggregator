import { createApp } from "./app";
import { createRepositories } from "../repositories/createRepositories";
import { loadSeedData } from "./seedLoader";
import { getPool } from "../db/pool";
import { runMigrations } from "../db/migrate";

const PORT = process.env.PORT || 3001;

async function start() {
  const repos = createRepositories();

  if (process.env.DATABASE_URL) {
    const pool = getPool();
    await runMigrations(pool);
  }

  await loadSeedData(repos.articles);

  const app = createApp(repos);
  app.listen(PORT, () => {
    console.log(`API server listening on port ${PORT}`);
  });
}

start().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
