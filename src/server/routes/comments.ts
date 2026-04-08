import { Router, Request } from "express";
import { HighlightRepository, VoteRepository, CommentRepository } from "@repositories";
import { requireAuth, optionalAuth } from "@middleware";
import crypto from "crypto";

const MAX_COMMENT_LENGTH = 250;
const MAX_COMMENTS_PER_THREAD = 50;
const COMMENT_WARNING_THRESHOLD = 45;

export function commentsRouter(
  highlightRepo: HighlightRepository,
  voteRepo: VoteRepository,
  commentRepo: CommentRepository
): Router {
  const router = Router({ mergeParams: true });

  router.get("/:id/comments", optionalAuth, async (req: Request<{ id: string }>, res) => {
    const highlightId = req.params.id;
    const highlight = await highlightRepo.findById(highlightId);
    if (!highlight) {
      res.status(404).json({ error: "Highlight not found" });
      return;
    }

    const comments = await commentRepo.findByHighlight(highlightId);
    const commentCount = comments.length;
    res.json({
      comments,
      total: commentCount,
      warning: commentCount >= COMMENT_WARNING_THRESHOLD && commentCount < MAX_COMMENTS_PER_THREAD
        ? `Thread is approaching the ${MAX_COMMENTS_PER_THREAD}-comment limit (${commentCount}/${MAX_COMMENTS_PER_THREAD})`
        : null,
    });
  });

  router.post("/:id/comments", requireAuth, async (req: Request<{ id: string }>, res) => {
    const highlightId = req.params.id;
    const highlight = await highlightRepo.findById(highlightId);
    if (!highlight) {
      res.status(404).json({ error: "Highlight not found" });
      return;
    }

    // Must have voted first
    const vote = await voteRepo.findByHighlightAndUser(highlightId, req.user!.userId);
    if (!vote) {
      res.status(403).json({ error: "You must vote on a highlight before commenting" });
      return;
    }

    const { text, replyToId } = req.body;
    if (!text || !String(text).trim()) {
      res.status(400).json({ error: "text is required" });
      return;
    }

    const trimmedText = String(text).trim();
    if (trimmedText.length > MAX_COMMENT_LENGTH) {
      res.status(400).json({ error: `Comment must be ${MAX_COMMENT_LENGTH} characters or less` });
      return;
    }

    const commentCount = await commentRepo.countByHighlight(highlightId);
    if (commentCount >= MAX_COMMENTS_PER_THREAD) {
      res.status(400).json({ error: `Thread has reached the ${MAX_COMMENTS_PER_THREAD}-comment limit` });
      return;
    }

    // Validate replyToId if provided
    if (replyToId) {
      const replyTo = await commentRepo.findById(String(replyToId));
      if (!replyTo) {
        res.status(400).json({ error: "Reply target comment not found" });
        return;
      }
      if (replyTo.highlightId !== highlightId) {
        res.status(400).json({ error: "Reply target must be in the same thread" });
        return;
      }
    }

    const now = Date.now();
    const comment = {
      id: crypto.randomUUID(),
      highlightId,
      userId: req.user!.userId,
      text: trimmedText,
      replyToId: replyToId ? String(replyToId) : null,
      createdAt: now,
    };

    await commentRepo.save(comment);

    const newCount = await commentRepo.countByHighlight(highlightId);
    const warning = newCount >= COMMENT_WARNING_THRESHOLD && newCount < MAX_COMMENTS_PER_THREAD
      ? `Thread is approaching the ${MAX_COMMENTS_PER_THREAD}-comment limit (${newCount}/${MAX_COMMENTS_PER_THREAD})`
      : null;

    res.status(201).json({ ...comment, warning });
  });

  return router;
}
