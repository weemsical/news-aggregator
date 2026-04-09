import { Router } from "express";
import { ArticleRepository, FeedSourceRepository, RawArticleRepository, ReplacementRuleRepository } from "@repositories";
import { anonymize, dateSeededHash, ScheduledIngestion } from "@services";
import { requireAuth } from "@middleware";

const PAGE_SIZE = 20;

export interface ArticlesRouterDeps {
  feedSources?: FeedSourceRepository;
  rawArticles?: RawArticleRepository;
  replacementRules?: ReplacementRuleRepository;
}

export function articlesRouter(articleRepo: ArticleRepository, deps?: ArticlesRouterDeps): Router {
  const router = Router();

  router.get("/", async (req, res) => {
    const sort = req.query.sort === "propaganda" ? "propaganda" : "date";
    const page = Math.max(1, parseInt(req.query.page as string) || 1);

    const result = await articleRepo.findApprovedPaged({
      sort,
      page,
      pageSize: PAGE_SIZE,
    });

    // Apply date-seeded shuffle within the page for tiebreaking
    const today = new Date().toISOString().slice(0, 10);
    result.articles.sort((a, b) => {
      const primary =
        sort === "propaganda"
          ? b.propagandaScore - a.propagandaScore
          : b.fetchedAt - a.fetchedAt;
      if (primary !== 0) return primary;
      return dateSeededHash(a.id, today) - dateSeededHash(b.id, today);
    });

    res.json({
      articles: result.articles.map(anonymize),
      total: result.total,
      page,
      pageSize: PAGE_SIZE,
    });
  });

  router.post("/refresh", requireAuth, async (_req, res) => {
    if (!deps?.feedSources || !deps?.rawArticles || !deps?.replacementRules) {
      res.status(500).json({ error: "Refresh not available" });
      return;
    }

    try {
      const result = await ScheduledIngestion.runIngestion({
        articles: articleRepo,
        rawArticles: deps.rawArticles,
        feedSources: deps.feedSources,
        replacementRules: deps.replacementRules,
      });

      res.json({
        totalArticlesSaved: result.totalArticlesSaved,
        feedResults: result.feedResults.length,
      });
    } catch {
      res.status(500).json({ error: "Failed to refresh articles" });
    }
  });

  router.get("/:id", async (req, res) => {
    const article = await articleRepo.findById(req.params.id);
    if (!article) {
      res.status(404).json({ error: "Article not found" });
      return;
    }
    res.json(anonymize(article));
  });

  return router;
}
