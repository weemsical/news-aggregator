import { Router, Request } from "express";
import { HighlightRepository, VoteRepository } from "@repositories";
import { requireAuth, optionalAuth } from "@middleware";
import crypto from "crypto";

export function votesRouter(
  highlightRepo: HighlightRepository,
  voteRepo: VoteRepository
): Router {
  const router = Router({ mergeParams: true });

  router.get("/:id/votes", optionalAuth, async (req: Request<{ id: string }>, res) => {
    const highlightId = req.params.id;
    const highlight = await highlightRepo.findById(highlightId);
    if (!highlight) {
      res.status(404).json({ error: "Highlight not found" });
      return;
    }

    const counts = await voteRepo.countByHighlight(highlightId);
    const userId = req.user?.userId;
    let userVote: string | null = null;
    if (userId) {
      const existing = await voteRepo.findByHighlightAndUser(highlightId, userId);
      userVote = existing ? existing.voteType : null;
    }

    res.json({ agrees: counts.agrees, disagrees: counts.disagrees, userVote });
  });

  router.post("/:id/votes", requireAuth, async (req: Request<{ id: string }>, res) => {
    const highlightId = req.params.id;
    const highlight = await highlightRepo.findById(highlightId);
    if (!highlight) {
      res.status(404).json({ error: "Highlight not found" });
      return;
    }

    if (highlight.userId === req.user!.userId) {
      res.status(403).json({ error: "Cannot vote on your own highlight" });
      return;
    }

    const { voteType, reason } = req.body;
    if (voteType !== "agree" && voteType !== "disagree") {
      res.status(400).json({ error: "voteType must be 'agree' or 'disagree'" });
      return;
    }

    if (voteType === "disagree" && (!reason || !String(reason).trim())) {
      res.status(400).json({ error: "reason is required when disagreeing" });
      return;
    }

    const existing = await voteRepo.findByHighlightAndUser(highlightId, req.user!.userId);

    if (existing) {
      const updated = await voteRepo.update(existing.id, {
        voteType,
        reason: voteType === "disagree" ? String(reason) : null,
      });
      res.status(200).json(updated);
      return;
    }

    const now = Date.now();
    const vote = {
      id: crypto.randomUUID(),
      highlightId,
      userId: req.user!.userId,
      voteType: voteType as "agree" | "disagree",
      reason: voteType === "disagree" ? String(reason) : null,
      createdAt: now,
      updatedAt: now,
    };

    await voteRepo.save(vote);
    res.status(201).json(vote);
  });

  return router;
}
