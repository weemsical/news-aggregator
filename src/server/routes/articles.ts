import { Router } from "express";
import { ArticleRepository } from "../../repositories/ArticleRepository";
import { anonymize } from "../../services/anonymize";

export function articlesRouter(articleRepo: ArticleRepository): Router {
  const router = Router();

  router.get("/", async (_req, res) => {
    const articles = await articleRepo.findAll();
    res.json(articles.map(anonymize));
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
