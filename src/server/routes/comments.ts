import { Router, Request } from "express";
import { HighlightRepository, VoteRepository, CommentRepository } from "@repositories";
import { requireAuth, optionalAuth } from "@middleware";
import { CommentService, NotificationService } from "@services";

export function commentsRouter(
  highlightRepo: HighlightRepository,
  voteRepo: VoteRepository,
  commentRepo: CommentRepository,
  notificationService?: NotificationService
): Router {
  const router = Router({ mergeParams: true });
  const commentService = notificationService
    ? new CommentService(commentRepo, voteRepo, notificationService)
    : null;

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
      warning: commentCount >= CommentService.WARNING_THRESHOLD && commentCount < CommentService.MAX_COMMENTS_PER_THREAD
        ? `Thread is approaching the ${CommentService.MAX_COMMENTS_PER_THREAD}-comment limit (${commentCount}/${CommentService.MAX_COMMENTS_PER_THREAD})`
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

    if (!commentService) {
      res.status(503).json({ error: "Comments are unavailable" });
      return;
    }

    const result = await commentService.createComment({
      highlightId,
      userId: req.user!.userId,
      text: req.body.text,
      replyToId: req.body.replyToId,
    });

    if (!result.ok) {
      res.status(result.status).json({ error: result.error });
      return;
    }

    res.status(201).json({ ...result.comment, warning: result.warning });
  });

  return router;
}
