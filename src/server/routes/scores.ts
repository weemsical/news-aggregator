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
      // Include the entire "to" day
      options.to = new Date(toStr).getTime() + 24 * 60 * 60 * 1000 - 1;
    }

    const articles = await articleRepo.findApproved(options);

    // Group by sourceId
    const sourceMap = new Map<string, { totalScore: number; articleCount: number }>();
    for (const article of articles) {
      const entry = sourceMap.get(article.sourceId) || { totalScore: 0, articleCount: 0 };
      entry.totalScore += article.propagandaScore;
      entry.articleCount++;
      sourceMap.set(article.sourceId, entry);
    }

    // Look up source names
    const allSources = await feedSourceRepo.findAll();
    const sourceNames = new Map(allSources.map((s) => [s.sourceId, s.name]));

    const scores: SourceScore[] = [];
    for (const [sourceId, data] of sourceMap) {
      scores.push({
        sourceId,
        sourceName: sourceNames.get(sourceId) || sourceId,
        totalScore: data.totalScore,
        averageScore: data.articleCount > 0 ? data.totalScore / data.articleCount : 0,
        articleCount: data.articleCount,
      });
    }

    scores.sort((a, b) => b.totalScore - a.totalScore);
    res.json(scores);
  });

  return router;
}
