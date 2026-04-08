import { Router, Request } from "express";
import { ArticleRepository, HighlightRepository, HighlightClusterRepository, VoteRepository } from "@repositories";
import { requireAuth, optionalAuth } from "../middleware/requireAuth";
import { anonRateLimit } from "../middleware/anonRateLimit";
import { RequestHandler } from "express";
import { findOverlaps, ClusterService } from "@services";
import crypto from "crypto";

export function highlightsRouter(
  articleRepo: ArticleRepository,
  highlightRepo: HighlightRepository,
  rateLimitMiddleware: RequestHandler = anonRateLimit,
  clusterRepo?: HighlightClusterRepository,
  voteRepo?: VoteRepository
): Router {
  const router = Router({ mergeParams: true });

  const clusterService = clusterRepo
    ? new ClusterService(highlightRepo, clusterRepo)
    : null;

  router.get("/check-overlap", requireAuth, async (req: Request<{ id: string }>, res) => {
    const articleId = req.params.id;
    const exists = await articleRepo.exists(articleId);
    if (!exists) {
      res.status(404).json({ error: "Article not found" });
      return;
    }

    const paragraphIndex = parseInt(req.query.paragraphIndex as string);
    const startOffset = parseInt(req.query.startOffset as string);
    const endOffset = parseInt(req.query.endOffset as string);

    if (isNaN(paragraphIndex) || isNaN(startOffset) || isNaN(endOffset)) {
      res.status(400).json({ error: "paragraphIndex, startOffset, and endOffset are required query parameters" });
      return;
    }

    const allHighlights = await highlightRepo.findByArticle(articleId);
    const overlaps = findOverlaps(allHighlights, paragraphIndex, startOffset, endOffset);

    res.json(overlaps);
  });

  router.get("/", optionalAuth, async (req: Request<{ id: string }>, res) => {
    const articleId = req.params.id;
    const userId = req.query.userId as string | undefined;

    let highlights;
    if (userId) {
      highlights = await highlightRepo.findByArticleAndUser(articleId, userId);
    } else {
      highlights = await highlightRepo.findByArticle(articleId);
    }

    // Enrich with vote counts if voteRepo available
    if (voteRepo) {
      const enriched = await Promise.all(
        highlights.map(async (h) => {
          const counts = await voteRepo.countByHighlight(h.id);
          return { ...h, voteCounts: counts };
        })
      );
      res.json(enriched);
      return;
    }

    res.json(highlights);
  });

  router.post("/", optionalAuth, rateLimitMiddleware, async (req: Request<{ id: string }>, res) => {
    const articleId = req.params.id;
    const exists = await articleRepo.exists(articleId);
    if (!exists) {
      res.status(404).json({ error: "Article not found" });
      return;
    }

    const { paragraphIndex, startOffset, endOffset, highlightedText, explanation } = req.body;
    const isAnonymous = !req.user;

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
    if (!isAnonymous && (!explanation || !String(explanation).trim())) {
      res.status(400).json({ error: "explanation is required" });
      return;
    }

    const now = Date.now();
    const highlight = {
      id: crypto.randomUUID(),
      articleId,
      userId: isAnonymous ? "anon" : req.user!.userId,
      paragraphIndex,
      startOffset,
      endOffset,
      highlightedText: String(highlightedText),
      explanation: isAnonymous ? "" : String(explanation),
      isEdited: false,
      originalExplanation: null,
      createdAt: now,
      updatedAt: now,
    };

    await highlightRepo.save(highlight);

    // Trigger cluster recalculation
    if (clusterService && !isAnonymous) {
      await clusterService.recalculateClusters(articleId, paragraphIndex);
    }

    res.status(201).json(highlight);
  });

  return router;
}

export function highlightActionsRouter(
  highlightRepo: HighlightRepository,
  clusterService?: ClusterService | null
): Router {
  const router = Router();

  router.put("/:id", requireAuth, async (req: Request<{ id: string }>, res) => {
    const highlight = await highlightRepo.findById(req.params.id);
    if (!highlight) {
      res.status(404).json({ error: "Highlight not found" });
      return;
    }
    if (highlight.userId === "anon") {
      res.status(403).json({ error: "Anonymous highlights cannot be edited" });
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
    if (highlight.userId === "anon") {
      res.status(403).json({ error: "Anonymous highlights cannot be deleted" });
      return;
    }
    if (highlight.userId !== req.user!.userId) {
      res.status(403).json({ error: "Not authorized to delete this highlight" });
      return;
    }

    await highlightRepo.delete(req.params.id);

    // Trigger cluster recalculation
    if (clusterService) {
      await clusterService.recalculateClusters(highlight.articleId, highlight.paragraphIndex);
    }

    res.status(204).send();
  });

  return router;
}
