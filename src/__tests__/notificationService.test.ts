import { NotificationService } from "../services/NotificationService";
import { TestInMemoryNotificationRepository } from "@helpers";
import { TestInMemoryHighlightRepository } from "@helpers";
import { TestInMemoryUserRepository } from "@helpers";
import { TestInMemoryCommentRepository } from "@helpers";

function buildDeps() {
  const notifications = new TestInMemoryNotificationRepository();
  const highlights = new TestInMemoryHighlightRepository();
  const users = new TestInMemoryUserRepository();
  const comments = new TestInMemoryCommentRepository();
  const service = new NotificationService(notifications, highlights, users, comments);
  return { notifications, highlights, users, comments, service };
}

describe("NotificationService", () => {
  describe("notifyAgreement", () => {
    it("creates a notification for the highlight owner", async () => {
      const { notifications, highlights, service } = buildDeps();
      await highlights.save({
        id: "h1", articleId: "a1", userId: "owner", paragraphIndex: 0,
        startOffset: 0, endOffset: 10, highlightedText: "test",
        explanation: "reason", isEdited: false, originalExplanation: null,
        createdAt: Date.now(), updatedAt: Date.now(),
      });

      await service.notifyAgreement("h1", "voter1");

      const ownerNotifs = await notifications.findByUser("owner");
      expect(ownerNotifs).toHaveLength(1);
      expect(ownerNotifs[0].type).toBe("agreement");
      expect(ownerNotifs[0].message).toContain("agreed");
    });

    it("batches multiple agreements into one notification", async () => {
      const { notifications, highlights, service } = buildDeps();
      await highlights.save({
        id: "h1", articleId: "a1", userId: "owner", paragraphIndex: 0,
        startOffset: 0, endOffset: 10, highlightedText: "test",
        explanation: "reason", isEdited: false, originalExplanation: null,
        createdAt: Date.now(), updatedAt: Date.now(),
      });

      await service.notifyAgreement("h1", "voter1");
      await service.notifyAgreement("h1", "voter2");

      const ownerNotifs = await notifications.findByUser("owner");
      expect(ownerNotifs).toHaveLength(1);
      expect(ownerNotifs[0].message).toContain("2");
    });

    it("does not notify the highlight owner when they vote on their own", async () => {
      const { notifications, highlights, service } = buildDeps();
      await highlights.save({
        id: "h1", articleId: "a1", userId: "owner", paragraphIndex: 0,
        startOffset: 0, endOffset: 10, highlightedText: "test",
        explanation: "reason", isEdited: false, originalExplanation: null,
        createdAt: Date.now(), updatedAt: Date.now(),
      });

      await service.notifyAgreement("h1", "owner");

      const ownerNotifs = await notifications.findByUser("owner");
      expect(ownerNotifs).toHaveLength(0);
    });
  });

  describe("notifyDisagreement", () => {
    it("creates an individual notification for the highlight owner", async () => {
      const { notifications, highlights, service } = buildDeps();
      await highlights.save({
        id: "h1", articleId: "a1", userId: "owner", paragraphIndex: 0,
        startOffset: 0, endOffset: 10, highlightedText: "test",
        explanation: "reason", isEdited: false, originalExplanation: null,
        createdAt: Date.now(), updatedAt: Date.now(),
      });

      await service.notifyDisagreement("h1", "voter1");

      const ownerNotifs = await notifications.findByUser("owner");
      expect(ownerNotifs).toHaveLength(1);
      expect(ownerNotifs[0].type).toBe("disagreement");
      expect(ownerNotifs[0].message).toContain("disagreed");
    });
  });

  describe("notifyComment", () => {
    it("notifies highlight owner of a new comment", async () => {
      const { notifications, highlights, service } = buildDeps();
      await highlights.save({
        id: "h1", articleId: "a1", userId: "owner", paragraphIndex: 0,
        startOffset: 0, endOffset: 10, highlightedText: "test",
        explanation: "reason", isEdited: false, originalExplanation: null,
        createdAt: Date.now(), updatedAt: Date.now(),
      });

      await service.notifyComment("h1", "commenter1");

      const ownerNotifs = await notifications.findByUser("owner");
      expect(ownerNotifs).toHaveLength(1);
      expect(ownerNotifs[0].type).toBe("comment");
    });

    it("notifies other thread participants", async () => {
      const { notifications, highlights, comments, service } = buildDeps();
      await highlights.save({
        id: "h1", articleId: "a1", userId: "owner", paragraphIndex: 0,
        startOffset: 0, endOffset: 10, highlightedText: "test",
        explanation: "reason", isEdited: false, originalExplanation: null,
        createdAt: Date.now(), updatedAt: Date.now(),
      });
      await comments.save({
        id: "c1", highlightId: "h1", userId: "participant1",
        text: "Hello", replyToId: null, createdAt: Date.now(),
      });

      await service.notifyComment("h1", "commenter1");

      const participantNotifs = await notifications.findByUser("participant1");
      expect(participantNotifs).toHaveLength(1);
    });

    it("does not notify the commenter themselves", async () => {
      const { notifications, highlights, service } = buildDeps();
      await highlights.save({
        id: "h1", articleId: "a1", userId: "commenter1", paragraphIndex: 0,
        startOffset: 0, endOffset: 10, highlightedText: "test",
        explanation: "reason", isEdited: false, originalExplanation: null,
        createdAt: Date.now(), updatedAt: Date.now(),
      });

      await service.notifyComment("h1", "commenter1");

      const notifs = await notifications.findByUser("commenter1");
      expect(notifs).toHaveLength(0);
    });
  });

  describe("notifyFeedFailure", () => {
    it("creates notifications for all admin users", async () => {
      const { notifications, users, service } = buildDeps();
      await users.save({
        id: "admin1", email: "admin1@test.com", passwordHash: "hash", isAdmin: true, createdAt: Date.now(),
      });
      await users.save({
        id: "admin2", email: "admin2@test.com", passwordHash: "hash", isAdmin: true, createdAt: Date.now(),
      });
      await users.save({
        id: "regular", email: "user@test.com", passwordHash: "hash", isAdmin: false, createdAt: Date.now(),
      });

      await service.notifyFeedFailure("fox-news", "Fox News", "Connection timeout");

      const admin1Notifs = await notifications.findByUser("admin1");
      expect(admin1Notifs).toHaveLength(1);
      expect(admin1Notifs[0].type).toBe("feed_failure");
      expect(admin1Notifs[0].message).toContain("Fox News");

      const admin2Notifs = await notifications.findByUser("admin2");
      expect(admin2Notifs).toHaveLength(1);

      const regularNotifs = await notifications.findByUser("regular");
      expect(regularNotifs).toHaveLength(0);
    });
  });

  describe("notifyNewArticles", () => {
    it("creates notifications for all users", async () => {
      const { notifications, users, service } = buildDeps();
      await users.save({
        id: "u1", email: "u1@test.com", passwordHash: "hash", isAdmin: false, createdAt: Date.now(),
      });
      await users.save({
        id: "u2", email: "u2@test.com", passwordHash: "hash", isAdmin: false, createdAt: Date.now(),
      });

      await service.notifyNewArticles(5);

      const u1Notifs = await notifications.findByUser("u1");
      expect(u1Notifs).toHaveLength(1);
      expect(u1Notifs[0].type).toBe("new_articles");
      expect(u1Notifs[0].message).toContain("5");
    });
  });
});
