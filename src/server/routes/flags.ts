import { Router, Request } from "express";
import { ArticleRepository } from "../../repositories/ArticleRepository";
import { FlagRepository } from "../../repositories/FlagRepository";

let flagIdCounter = 0;

export function flagsRouter(
  articleRepo: ArticleRepository,
  flagRepo: FlagRepository
): Router {
  const router = Router({ mergeParams: true });

  router.get("/", async (req: Request<{ id: string }>, res) => {
    const flags = await flagRepo.findByArticle(req.params.id);
    res.json(flags);
  });

  router.post("/", async (req: Request<{ id: string }>, res) => {
    const articleId = req.params.id;
    const exists = await articleRepo.exists(articleId);
    if (!exists) {
      res.status(404).json({ error: "Article not found" });
      return;
    }

    const { highlightedText, explanation } = req.body;
    if (!highlightedText || !String(highlightedText).trim()) {
      res.status(400).json({ error: "highlightedText is required" });
      return;
    }
    if (!explanation || !String(explanation).trim()) {
      res.status(400).json({ error: "explanation is required" });
      return;
    }

    flagIdCounter++;
    const flag = {
      id: `flag-${Date.now()}-${flagIdCounter}`,
      articleId,
      highlightedText: String(highlightedText),
      explanation: String(explanation),
      timestamp: Date.now(),
    };

    await flagRepo.save(flag);
    res.status(201).json(flag);
  });

  return router;
}
