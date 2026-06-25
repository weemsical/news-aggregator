import { CommentRepository, VoteRepository } from "@repositories";
import { Comment } from "@types";
import { NotificationService } from "./NotificationService";
import crypto from "crypto";

export interface CreateCommentParams {
  highlightId: string;
  userId: string;
  text: unknown;
  replyToId?: unknown;
}

export type CreateCommentResult =
  | { ok: true; comment: Comment; warning: string | null }
  | { ok: false; status: number; error: string };

export class CommentService {
  static readonly MAX_COMMENT_LENGTH = 250;
  static readonly MAX_COMMENTS_PER_THREAD = 50;
  static readonly WARNING_THRESHOLD = 45;

  constructor(
    private commentRepo: CommentRepository,
    private voteRepo: VoteRepository,
    private notificationService: NotificationService
  ) {}

  warningFor(count: number): string | null {
    return count >= CommentService.WARNING_THRESHOLD && count < CommentService.MAX_COMMENTS_PER_THREAD
      ? `Thread is approaching the ${CommentService.MAX_COMMENTS_PER_THREAD}-comment limit (${count}/${CommentService.MAX_COMMENTS_PER_THREAD})`
      : null;
  }

  async createComment(params: CreateCommentParams): Promise<CreateCommentResult> {
    const { highlightId, userId, text, replyToId } = params;

    const vote = await this.voteRepo.findByHighlightAndUser(highlightId, userId);
    if (!vote) {
      return { ok: false, status: 403, error: "You must vote on a highlight before commenting" };
    }

    if (!text || !String(text).trim()) {
      return { ok: false, status: 400, error: "text is required" };
    }

    const trimmedText = String(text).trim();
    if (trimmedText.length > CommentService.MAX_COMMENT_LENGTH) {
      return { ok: false, status: 400, error: `Comment must be ${CommentService.MAX_COMMENT_LENGTH} characters or less` };
    }

    const commentCount = await this.commentRepo.countByHighlight(highlightId);
    if (commentCount >= CommentService.MAX_COMMENTS_PER_THREAD) {
      return { ok: false, status: 400, error: `Thread has reached the ${CommentService.MAX_COMMENTS_PER_THREAD}-comment limit` };
    }

    if (replyToId) {
      const replyTo = await this.commentRepo.findById(String(replyToId));
      if (!replyTo) {
        return { ok: false, status: 400, error: "Reply target comment not found" };
      }
      if (replyTo.highlightId !== highlightId) {
        return { ok: false, status: 400, error: "Reply target must be in the same thread" };
      }
    }

    const comment: Comment = {
      id: crypto.randomUUID(),
      highlightId,
      userId,
      text: trimmedText,
      replyToId: replyToId ? String(replyToId) : null,
      createdAt: Date.now(),
    };

    await this.commentRepo.save(comment);
    await this.notificationService.notifyComment(highlightId, userId);

    const newCount = await this.commentRepo.countByHighlight(highlightId);
    return { ok: true, comment, warning: this.warningFor(newCount) };
  }
}
