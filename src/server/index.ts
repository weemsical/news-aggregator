import { createApp } from "./app";
import { createRepositories } from "@repositories";
import { loadSeedData } from "./seedLoader";
import { getPool } from "../db/pool";
import { runMigrations } from "../db/migrate";
import { startCronJobs } from "./cron";
import { NotificationService } from "@services";

const PORT = process.env.PORT || 3001;

async function start() {
  if (process.env.NODE_ENV === "production" && !process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET environment variable is required in production");
  }

  const repos = createRepositories();

  const pool = getPool();
  await runMigrations(pool);

  await loadSeedData({ articles: repos.articles, rawArticles: repos.rawArticles });

  const notificationService = new NotificationService(
    repos.notifications, repos.highlights, repos.users, repos.comments
  );

  const app = createApp({ ...repos, notificationService });

  startCronJobs({
    articles: repos.articles,
    rawArticles: repos.rawArticles,
    feedSources: repos.feedSources,
    replacementRules: repos.replacementRules,
    notificationService,
  });

  app.listen(PORT, () => {
    console.log(`API server listening on port ${PORT}`);
  });
}

start().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
