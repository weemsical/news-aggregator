import cron from "node-cron";
import { ScheduledIngestion, IngestionDeps } from "@services";

export function startCronJobs(deps: IngestionDeps): void {
  // Daily at 5:00 AM server local time
  cron.schedule("0 5 * * *", async () => {
    console.log("[cron] Starting daily feed ingestion...");
    try {
      const result = await ScheduledIngestion.runIngestion(deps);
      console.log(
        `[cron] Ingestion complete: ${result.totalArticlesSaved} articles saved, ` +
        `${result.feedResults.filter((r) => !r.success).length} feeds failed`
      );
    } catch (err) {
      console.error("[cron] Ingestion failed:", err);
    }
  });

  console.log("[cron] Daily feed ingestion scheduled for 5:00 AM");
}
