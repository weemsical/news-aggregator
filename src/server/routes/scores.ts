import { Router } from "express";
import { ArticleRepository, FeedSourceRepository } from "@repositories";
import { requireAuth } from "@middleware";
import { SourceScore } from "@types";

export function scoresRouter(
  articleRepo: ArticleRepository,
  feedSourceRepo: FeedSourceRepository
): Router {
  const router = Router();

  router.get("/", requireAuth, async (req, res) => {
    const fromStr = req.query.from as string | undefined;
    const toStr = req.query.to as string | undefined;

    const options: { from?: number; to?: number } = {};
    if (fromStr) {
      options.from = new Date(fromStr).getTime();
    }
    if (toStr) {
      options.to = new Date(toStr).getTime() + 24 * 60 * 60 * 1000 - 1;
    }

    const scoreRows = await articleRepo.getScoresBySource(options);

    const allSources = await feedSourceRepo.findAll();
    const sourceNames = new Map(allSources.map((s) => [s.sourceId, s.name]));

    const scores: SourceScore[] = scoreRows.map((row) => ({
      sourceId: row.sourceId,
      sourceName: sourceNames.get(row.sourceId) || row.sourceId,
      totalScore: row.totalScore,
      averageScore: row.articleCount > 0 ? row.totalScore / row.articleCount : 0,
      articleCount: row.articleCount,
    }));

    res.json(scores);
  });

  return router;
}
