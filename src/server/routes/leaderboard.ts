import { Router } from "express";
import { ArticleRepository } from "../../repositories/ArticleRepository";
import { FlagRepository } from "../../repositories/FlagRepository";
import { FeedSourceRepository } from "../../repositories/FeedSourceRepository";
import { feedSources } from "../../data/feedSources";
import { getAllFeedSources } from "../../data/getAllFeedSources";
import { LeaderboardEntry } from "../../types";

export function leaderboardRouter(
  articles: ArticleRepository,
  flags: FlagRepository,
  feedSourceRepo?: FeedSourceRepository
): Router {
  const router = Router();

  router.get("/", async (_req, res) => {
    try {
      const allSources = feedSourceRepo
        ? await getAllFeedSources(feedSourceRepo)
        : feedSources;
      const sourceNameMap = new Map(
        allSources.map((s) => [s.sourceId, s.name])
      );

      const [allFlags, allArticles] = await Promise.all([
        flags.findAll(),
        articles.findAll(),
      ]);

      const articleSourceMap = new Map(
        allArticles.map((a) => [a.id, a.sourceId])
      );

      const counts = new Map<string, number>();
      for (const flag of allFlags) {
        const sourceId = articleSourceMap.get(flag.articleId);
        if (!sourceId) continue;
        counts.set(sourceId, (counts.get(sourceId) ?? 0) + 1);
      }

      const entries: LeaderboardEntry[] = Array.from(counts.entries())
        .map(([sourceId, flagCount]) => ({
          sourceId,
          sourceName: sourceNameMap.get(sourceId) ?? sourceId,
          flagCount,
        }))
        .sort((a, b) => b.flagCount - a.flagCount);

      res.json(entries);
    } catch {
      res.status(500).json({ error: "Failed to load leaderboard" });
    }
  });

  return router;
}
