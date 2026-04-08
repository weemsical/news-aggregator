import { Router } from "express";
import { ArticleRepository } from "@repositories";
import { anonymize, dateSeededHash } from "@services";

const PAGE_SIZE = 20;

export function articlesRouter(articleRepo: ArticleRepository): Router {
  const router = Router();

  router.get("/", async (req, res) => {
    const sort = req.query.sort === "propaganda" ? "propaganda" : "date";
    const page = Math.max(1, parseInt(req.query.page as string) || 1);

    const articles = await articleRepo.findApproved();
    const today = new Date().toISOString().slice(0, 10);

    articles.sort((a, b) => {
      const primary =
        sort === "propaganda"
          ? b.propagandaScore - a.propagandaScore
          : b.fetchedAt - a.fetchedAt;
      if (primary !== 0) return primary;
      // Tiebreaker: date-seeded shuffle
      return dateSeededHash(a.id, today) - dateSeededHash(b.id, today);
    });

    const total = articles.length;
    const start = (page - 1) * PAGE_SIZE;
    const paged = articles.slice(start, start + PAGE_SIZE);

    res.json({
      articles: paged.map(anonymize),
      total,
      page,
      pageSize: PAGE_SIZE,
    });
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
