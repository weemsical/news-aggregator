import { NotificationRepository, HighlightRepository, UserRepository, CommentRepository } from "@repositories";
import crypto from "crypto";

export class NotificationService {
  constructor(
    private notifications: NotificationRepository,
    private highlights: HighlightRepository,
    private users: UserRepository,
    private comments: CommentRepository
  ) {}

  async notifyAgreement(highlightId: string, voterId: string): Promise<void> {
    const highlight = await this.highlights.findById(highlightId);
    if (!highlight || highlight.userId === voterId) return;

    // Check for existing unread agreement notification for this highlight
    const existing = await this.notifications.findByTypeAndReference(
      highlight.userId, "agreement", highlightId
    );

    if (existing) {
      // Batch: update the message with incremented count
      const match = existing.message.match(/^(\d+) users? agreed/);
      const currentCount = match ? parseInt(match[1], 10) : 1;
      const newCount = currentCount + 1;
      await this.notifications.save({
        ...existing,
        message: `${newCount} users agreed with your highlight`,
      });
    } else {
      await this.notifications.save({
        id: crypto.randomUUID(),
        userId: highlight.userId,
        type: "agreement",
        referenceId: highlightId,
        message: "1 user agreed with your highlight",
        isRead: false,
        acknowledgedBy: [],
        createdAt: Date.now(),
      });
    }
  }

  async notifyDisagreement(highlightId: string, voterId: string): Promise<void> {
    const highlight = await this.highlights.findById(highlightId);
    if (!highlight || highlight.userId === voterId) return;

    await this.notifications.save({
      id: crypto.randomUUID(),
      userId: highlight.userId,
      type: "disagreement",
      referenceId: highlightId,
      message: "Someone disagreed with your highlight",
      isRead: false,
      acknowledgedBy: [],
      createdAt: Date.now(),
    });
  }

  async notifyComment(highlightId: string, commenterId: string): Promise<void> {
    const highlight = await this.highlights.findById(highlightId);
    if (!highlight) return;

    // Collect all unique participants: highlight owner + commenters
    const comments = await this.comments.findByHighlight(highlightId);
    const participants = new Set<string>();
    participants.add(highlight.userId);
    for (const c of comments) {
      participants.add(c.userId);
    }

    // Remove the commenter themselves
    participants.delete(commenterId);

    for (const userId of participants) {
      await this.notifications.save({
        id: crypto.randomUUID(),
        userId,
        type: "comment",
        referenceId: highlightId,
        message: "New comment on a highlight you're following",
        isRead: false,
        acknowledgedBy: [],
        createdAt: Date.now(),
      });
    }
  }

  async notifyNewArticles(count: number): Promise<void> {
    const allUsers = await this.users.findAll();

    for (const user of allUsers) {
      await this.notifications.save({
        id: crypto.randomUUID(),
        userId: user.id,
        type: "new_articles",
        referenceId: null,
        message: `${count} new articles available`,
        isRead: false,
        acknowledgedBy: [],
        createdAt: Date.now(),
      });
    }
  }

  async notifyFeedFailure(sourceId: string, sourceName: string, error: string): Promise<void> {
    const admins = await this.users.findAdmins();

    for (const admin of admins) {
      await this.notifications.save({
        id: crypto.randomUUID(),
        userId: admin.id,
        type: "feed_failure",
        referenceId: sourceId,
        message: `Feed "${sourceName}" failed: ${error}`,
        isRead: false,
        acknowledgedBy: [],
        createdAt: Date.now(),
      });
    }
  }
}
