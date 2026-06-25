import {
  TestInMemoryHighlightRepository,
  TestInMemoryHighlightClusterRepository,
  TestInMemoryVoteRepository,
  TestInMemoryNotificationRepository,
  TestInMemoryUserRepository,
  TestInMemoryCommentRepository,
} from "@helpers";
import { CommentService, NotificationService } from "@services";

describe("CommentService", () => {
  let highlights: TestInMemoryHighlightRepository;
  let votes: TestInMemoryVoteRepository;
  let comments: TestInMemoryCommentRepository;
  let notifications: TestInMemoryNotificationRepository;
  let users: TestInMemoryUserRepository;
  let clusters: TestInMemoryHighlightClusterRepository;
  let notificationService: NotificationService;
  let service: CommentService;

  beforeEach(async () => {
    highlights = new TestInMemoryHighlightRepository();
    votes = new TestInMemoryVoteRepository();
    comments = new TestInMemoryCommentRepository();
    notifications = new TestInMemoryNotificationRepository();
    users = new TestInMemoryUserRepository();
    clusters = new TestInMemoryHighlightClusterRepository();
    notificationService = new NotificationService(notifications, highlights, users, comments);
    service = new CommentService(comments, votes, notificationService);

    const now = Date.now();
    await highlights.save({
      id: "h1",
      articleId: "article-1",
      userId: "owner",
      paragraphIndex: 0,
      startOffset: 0,
      endOffset: 10,
      highlightedText: "paragraph ",
      explanation: "propaganda detected",
      isEdited: false,
      originalExplanation: null,
      createdAt: now,
      updatedAt: now,
    });
  });

  async function voteAs(userId: string) {
    await votes.save({
      id: `v-${userId}`,
      highlightId: "h1",
      userId,
      voteType: "agree",
      reason: null,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  }

  it("rejects commenting before voting", async () => {
    const result = await service.createComment({
      highlightId: "h1",
      userId: "commenter",
      text: "nice point",
    });

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.status).toBe(403);
  });

  it("creates a comment once the user has voted", async () => {
    await voteAs("commenter");

    const result = await service.createComment({
      highlightId: "h1",
      userId: "commenter",
      text: "  nice point  ",
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.comment.text).toBe("nice point");
      expect(result.comment.replyToId).toBeNull();
      expect(result.warning).toBeNull();
    }
    expect(await comments.count()).toBe(1);
  });

  it("rejects empty text", async () => {
    await voteAs("commenter");

    const result = await service.createComment({
      highlightId: "h1",
      userId: "commenter",
      text: "   ",
    });

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.status).toBe(400);
  });

  it("rejects text over the length limit", async () => {
    await voteAs("commenter");

    const result = await service.createComment({
      highlightId: "h1",
      userId: "commenter",
      text: "x".repeat(CommentService.MAX_COMMENT_LENGTH + 1),
    });

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.status).toBe(400);
  });

  it("rejects a reply to a comment in a different thread", async () => {
    await voteAs("commenter");
    await comments.save({
      id: "other",
      highlightId: "h2",
      userId: "someone",
      text: "elsewhere",
      replyToId: null,
      createdAt: Date.now(),
    });

    const result = await service.createComment({
      highlightId: "h1",
      userId: "commenter",
      text: "reply",
      replyToId: "other",
    });

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.status).toBe(400);
  });

  it("notifies the highlight owner on a new comment", async () => {
    await voteAs("commenter");

    await service.createComment({
      highlightId: "h1",
      userId: "commenter",
      text: "nice point",
    });

    const ownerNotifs = await notifications.findByUser("owner");
    expect(ownerNotifs.some((n) => n.type === "comment")).toBe(true);
  });
});
