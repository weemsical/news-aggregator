import { Router, Request } from "express";
import { ArticleRepository } from "../../repositories/ArticleRepository";
import { FlagRepository } from "../../repositories/FlagRepository";
import { requireAuth, optionalAuth } from "../middleware/requireAuth";

let flagIdCounter = 0;

export function flagsRouter(
  articleRepo: ArticleRepository,
  flagRepo: FlagRepository
): Router {
  const router = Router({ mergeParams: true });

  router.get("/", optionalAuth, async (req: Request<{ id: string }>, res) => {
    const articleId = req.params.id;
    const userId = req.query.userId as string | undefined;

    if (userId) {
      const flags = await flagRepo.findByArticleAndUser(articleId, userId);
      res.json(flags);
    } else {
      const flags = await flagRepo.findByArticle(articleId);
      res.json(flags);
    }
  });

  router.post("/", requireAuth, async (req: Request<{ id: string }>, res) => {
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
      userId: req.user!.userId,
      highlightedText: String(highlightedText),
      explanation: String(explanation),
      timestamp: Date.now(),
    };

    await flagRepo.save(flag);
    res.status(201).json(flag);
  });

  return router;
}
