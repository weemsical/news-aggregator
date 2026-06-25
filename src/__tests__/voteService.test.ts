import {
  TestInMemoryHighlightRepository,
  TestInMemoryHighlightClusterRepository,
  TestInMemoryArticleRepository,
  TestInMemoryVoteRepository,
  TestInMemoryNotificationRepository,
  TestInMemoryUserRepository,
  TestInMemoryCommentRepository,
} from "@helpers";
import { VoteService } from "../services/VoteService";
import { ScoringService, NotificationService } from "@services";
import { Highlight } from "@types";

function makeHighlight(overrides: Partial<Highlight> = {}): Highlight {
  const now = Date.now();
  return {
    id: "h1",
    articleId: "article-1",
    userId: "user-a",
    paragraphIndex: 0,
    startOffset: 0,
    endOffset: 10,
    highlightedText: "paragraph ",
    explanation: "propaganda detected",
    isEdited: false,
    originalExplanation: null,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

describe("VoteService", () => {
  let highlights: TestInMemoryHighlightRepository;
  let clusters: TestInMemoryHighlightClusterRepository;
  let articles: TestInMemoryArticleRepository;
  let votes: TestInMemoryVoteRepository;
  let notifications: TestInMemoryNotificationRepository;
  let users: TestInMemoryUserRepository;
  let comments: TestInMemoryCommentRepository;
  let scoringService: ScoringService;
  let notificationService: NotificationService;
  let service: VoteService;

  beforeEach(async () => {
    highlights = new TestInMemoryHighlightRepository();
    clusters = new TestInMemoryHighlightClusterRepository();
    articles = new TestInMemoryArticleRepository();
    votes = new TestInMemoryVoteRepository();
    notifications = new TestInMemoryNotificationRepository();
    users = new TestInMemoryUserRepository();
    comments = new TestInMemoryCommentRepository();
    scoringService = new ScoringService(clusters, votes, articles, highlights);
    notificationService = new NotificationService(notifications, highlights, users, comments);
    service = new VoteService(votes, scoringService, notificationService);

    await highlights.save(makeHighlight());
  });

  it("creates a new agree vote and recalculates score", async () => {
    const result = await service.castVote({
      highlightId: "h1",
      userId: "voter-1",
      voteType: "agree",
      articleId: "article-1",
    });

    expect(result.vote).toBeDefined();
    expect(result.vote.voteType).toBe("agree");
    expect(result.isNew).toBe(true);
  });

  it("creates a new disagree vote with reason", async () => {
    const result = await service.castVote({
      highlightId: "h1",
      userId: "voter-1",
      voteType: "disagree",
      reason: "Not propaganda",
      articleId: "article-1",
    });

    expect(result.vote.voteType).toBe("disagree");
    expect(result.vote.reason).toBe("Not propaganda");
  });

  it("updates an existing vote when user votes again", async () => {
    await service.castVote({
      highlightId: "h1",
      userId: "voter-1",
      voteType: "agree",
      articleId: "article-1",
    });

    const result = await service.castVote({
      highlightId: "h1",
      userId: "voter-1",
      voteType: "disagree",
      reason: "Changed my mind",
      articleId: "article-1",
    });

    expect(result.vote.voteType).toBe("disagree");
    expect(result.isNew).toBe(false);

    expect(await votes.count()).toBe(1);
  });

  it("sends agreement notification on agree vote", async () => {
    await service.castVote({
      highlightId: "h1",
      userId: "voter-1",
      voteType: "agree",
      articleId: "article-1",
    });

    const ownerNotifs = await notifications.findByUser("user-a");
    expect(ownerNotifs.some((n) => n.type === "agreement")).toBe(true);
  });

  it("sends disagreement notification on disagree vote", async () => {
    await service.castVote({
      highlightId: "h1",
      userId: "voter-1",
      voteType: "disagree",
      reason: "Not propaganda",
      articleId: "article-1",
    });

    const ownerNotifs = await notifications.findByUser("user-a");
    expect(ownerNotifs.some((n) => n.type === "disagreement")).toBe(true);
  });
});
