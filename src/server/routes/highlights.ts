import { Router, Request } from "express";
import { ArticleRepository } from "../../repositories/ArticleRepository";
import { HighlightRepository } from "../../repositories/HighlightRepository";
import { requireAuth, optionalAuth } from "../middleware/requireAuth";

let highlightIdCounter = 0;

export function highlightsRouter(
  articleRepo: ArticleRepository,
  highlightRepo: HighlightRepository
): Router {
  const router = Router({ mergeParams: true });

  router.get("/", optionalAuth, async (req: Request<{ id: string }>, res) => {
    const articleId = req.params.id;
    const userId = req.query.userId as string | undefined;

    if (userId) {
      const highlights = await highlightRepo.findByArticleAndUser(articleId, userId);
      res.json(highlights);
    } else {
      const highlights = await highlightRepo.findByArticle(articleId);
      res.json(highlights);
    }
  });

  router.post("/", requireAuth, async (req: Request<{ id: string }>, res) => {
    const articleId = req.params.id;
    const exists = await articleRepo.exists(articleId);
    if (!exists) {
      res.status(404).json({ error: "Article not found" });
      return;
    }

    const { paragraphIndex, startOffset, endOffset, highlightedText, explanation } = req.body;

    if (paragraphIndex == null || typeof paragraphIndex !== "number" || paragraphIndex < 0) {
      res.status(400).json({ error: "paragraphIndex is required and must be a non-negative number" });
      return;
    }
    if (startOffset == null || endOffset == null || typeof startOffset !== "number" || typeof endOffset !== "number") {
      res.status(400).json({ error: "startOffset and endOffset are required numbers" });
      return;
    }
    if (startOffset >= endOffset) {
      res.status(400).json({ error: "startOffset must be less than endOffset" });
      return;
    }
    if (!highlightedText || !String(highlightedText).trim()) {
      res.status(400).json({ error: "highlightedText is required" });
      return;
    }
    if (!explanation || !String(explanation).trim()) {
      res.status(400).json({ error: "explanation is required" });
      return;
    }

    highlightIdCounter++;
    const now = Date.now();
    const highlight = {
      id: `highlight-${now}-${highlightIdCounter}`,
      articleId,
      userId: req.user!.userId,
      paragraphIndex,
      startOffset,
      endOffset,
      highlightedText: String(highlightedText),
      explanation: String(explanation),
      isEdited: false,
      originalExplanation: null,
      createdAt: now,
      updatedAt: now,
    };

    await highlightRepo.save(highlight);
    res.status(201).json(highlight);
  });

  return router;
}

export function highlightActionsRouter(
  highlightRepo: HighlightRepository
): Router {
  const router = Router();

  router.put("/:id", requireAuth, async (req: Request<{ id: string }>, res) => {
    const highlight = await highlightRepo.findById(req.params.id);
    if (!highlight) {
      res.status(404).json({ error: "Highlight not found" });
      return;
    }
    if (highlight.userId !== req.user!.userId) {
      res.status(403).json({ error: "Not authorized to edit this highlight" });
      return;
    }

    const { explanation } = req.body;
    if (!explanation || !String(explanation).trim()) {
      res.status(400).json({ error: "explanation is required" });
      return;
    }

    const updated = await highlightRepo.update(req.params.id, {
      explanation: String(explanation),
    });
    res.json(updated);
  });

  router.delete("/:id", requireAuth, async (req: Request<{ id: string }>, res) => {
    const highlight = await highlightRepo.findById(req.params.id);
    if (!highlight) {
      res.status(404).json({ error: "Highlight not found" });
      return;
    }
    if (highlight.userId !== req.user!.userId) {
      res.status(403).json({ error: "Not authorized to delete this highlight" });
      return;
    }

    await highlightRepo.delete(req.params.id);
    res.status(204).send();
  });

  return router;
}
