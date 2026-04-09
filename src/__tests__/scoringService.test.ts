import { TestInMemoryArticleRepository } from "@helpers";
import { TestInMemoryVoteRepository } from "@helpers";
import { TestInMemoryHighlightClusterRepository } from "@helpers";
import { TestInMemoryHighlightRepository } from "@helpers";
import { ScoringService } from "@services";
import { Article, Highlight, HighlightCluster, Vote } from "@types";

function makeArticle(overrides: Partial<Article> = {}): Article {
  return {
    id: "article-1",
    rawArticleId: "raw-1",
    title: "Test Article",
    body: ["paragraph one"],
    sourceTags: ["politics"],
    sourceId: "fox-news",
    url: "https://example.com/1",
    fetchedAt: 1740000000000,
    reviewStatus: "approved",
    propagandaScore: 0,
    ...overrides,
  };
}

function makeCluster(overrides: Partial<HighlightCluster> = {}): HighlightCluster {
  const now = Date.now();
  return {
    id: "cluster-1",
    articleId: "article-1",
    paragraphIndex: 0,
    highlightIds: ["h1", "h2"],
    agreementCount: 2,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

function makeVote(overrides: Partial<Vote> = {}): Vote {
  const now = Date.now();
  return {
    id: "vote-1",
    highlightId: "h1",
    userId: "user-1",
    voteType: "agree",
    reason: null,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

function makeHighlight(id: string, userId: string, overrides: Partial<Highlight> = {}): Highlight {
  const now = Date.now();
  return {
    id,
    articleId: "article-1",
    userId,
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

describe("ScoringService", () => {
  let articles: TestInMemoryArticleRepository;
  let votes: TestInMemoryVoteRepository;
  let clusters: TestInMemoryHighlightClusterRepository;
  let highlights: TestInMemoryHighlightRepository;
  let scoring: ScoringService;

  beforeEach(() => {
    articles = new TestInMemoryArticleRepository();
    votes = new TestInMemoryVoteRepository();
    clusters = new TestInMemoryHighlightClusterRepository();
    highlights = new TestInMemoryHighlightRepository();
    scoring = new ScoringService(clusters, votes, articles, highlights);
  });

  it("returns 0 when article has no clusters", async () => {
    const score = await scoring.calculateArticleScore("article-1");
    expect(score).toBe(0);
  });

  it("returns 0 when clusters have fewer than 3 total votes", async () => {
    await clusters.save(makeCluster());
    await votes.save(makeVote({ id: "v1", highlightId: "h1", userId: "u1" }));
    await votes.save(makeVote({ id: "v2", highlightId: "h2", userId: "u2" }));

    const score = await scoring.calculateArticleScore("article-1");
    expect(score).toBe(0);
  });

  it("computes score for a single qualifying cluster with all agrees", async () => {
    // 2 highlights from 2 users, 3 agree votes -> 2 * (3/3) = 2.0
    await highlights.save(makeHighlight("h1", "user-a"));
    await highlights.save(makeHighlight("h2", "user-b", { startOffset: 10, endOffset: 20, highlightedText: "about polit" }));
    await clusters.save(makeCluster());
    await votes.save(makeVote({ id: "v1", highlightId: "h1", userId: "u1" }));
    await votes.save(makeVote({ id: "v2", highlightId: "h1", userId: "u2" }));
    await votes.save(makeVote({ id: "v3", highlightId: "h2", userId: "u3" }));

    const score = await scoring.calculateArticleScore("article-1");
    expect(score).toBeCloseTo(2.0);
  });

  it("computes score with mixed agrees and disagrees", async () => {
    // 2 highlights from 2 users, 2 agrees + 1 disagree -> 2 * (2/3) ≈ 1.333
    await highlights.save(makeHighlight("h1", "user-a"));
    await highlights.save(makeHighlight("h2", "user-b", { startOffset: 10, endOffset: 20, highlightedText: "about polit" }));
    await clusters.save(makeCluster());
    await votes.save(makeVote({ id: "v1", highlightId: "h1", userId: "u1", voteType: "agree" }));
    await votes.save(makeVote({ id: "v2", highlightId: "h1", userId: "u2", voteType: "agree" }));
    await votes.save(makeVote({ id: "v3", highlightId: "h2", userId: "u3", voteType: "disagree", reason: "I disagree" }));

    const score = await scoring.calculateArticleScore("article-1");
    expect(score).toBeCloseTo(2 * (2 / 3));
  });

  it("sums scores across multiple qualifying clusters", async () => {
    // Cluster 1: 2 highlights from 2 users, 3 agrees -> 2.0
    await highlights.save(makeHighlight("h1", "user-a"));
    await highlights.save(makeHighlight("h2", "user-b", { startOffset: 10, endOffset: 20, highlightedText: "about polit" }));
    await clusters.save(makeCluster({ id: "c1", highlightIds: ["h1", "h2"] }));
    await votes.save(makeVote({ id: "v1", highlightId: "h1", userId: "u1" }));
    await votes.save(makeVote({ id: "v2", highlightId: "h1", userId: "u2" }));
    await votes.save(makeVote({ id: "v3", highlightId: "h2", userId: "u3" }));

    // Cluster 2: 3 highlights from 3 users, 3 agrees -> 3.0
    await highlights.save(makeHighlight("h3", "user-c", { paragraphIndex: 1 }));
    await highlights.save(makeHighlight("h4", "user-d", { paragraphIndex: 1, startOffset: 10, endOffset: 20, highlightedText: "about polit" }));
    await highlights.save(makeHighlight("h5", "user-e", { paragraphIndex: 1, startOffset: 20, endOffset: 30, highlightedText: "ics and pr" }));
    await clusters.save(makeCluster({ id: "c2", paragraphIndex: 1, highlightIds: ["h3", "h4", "h5"] }));
    await votes.save(makeVote({ id: "v4", highlightId: "h3", userId: "u4" }));
    await votes.save(makeVote({ id: "v5", highlightId: "h4", userId: "u5" }));
    await votes.save(makeVote({ id: "v6", highlightId: "h5", userId: "u6" }));

    const score = await scoring.calculateArticleScore("article-1");
    expect(score).toBeCloseTo(5.0);
  });

  it("excludes anon votes from vote counts", async () => {
    await clusters.save(makeCluster());
    await votes.save(makeVote({ id: "v1", highlightId: "h1", userId: "u1" }));
    await votes.save(makeVote({ id: "v2", highlightId: "h1", userId: "anon" }));
    await votes.save(makeVote({ id: "v3", highlightId: "h2", userId: "anon" }));

    // Only 1 non-anon vote, below 3 threshold
    const score = await scoring.calculateArticleScore("article-1");
    expect(score).toBe(0);
  });

  it("counts unique users in cluster, not highlight count", async () => {
    // Same user has 2 highlights in the cluster — should count as 1 unique user, not 2
    await highlights.save(makeHighlight("h1", "user-a"));
    await highlights.save(makeHighlight("h2", "user-a", { startOffset: 10, endOffset: 20, highlightedText: "about polit" }));
    await clusters.save(makeCluster({ highlightIds: ["h1", "h2"] }));

    // 3 agree votes to meet threshold
    await votes.save(makeVote({ id: "v1", highlightId: "h1", userId: "u1" }));
    await votes.save(makeVote({ id: "v2", highlightId: "h1", userId: "u2" }));
    await votes.save(makeVote({ id: "v3", highlightId: "h2", userId: "u3" }));

    const score = await scoring.calculateArticleScore("article-1");
    // 1 unique user * (3 agrees / 3 total) = 1.0, NOT 2.0
    expect(score).toBeCloseTo(1.0);
  });

  it("counts distinct users across highlights in a cluster", async () => {
    // 3 highlights from 2 different users — should count as 2 unique users
    await highlights.save(makeHighlight("h1", "user-a"));
    await highlights.save(makeHighlight("h2", "user-b", { startOffset: 0, endOffset: 10, highlightedText: "paragraph " }));
    await highlights.save(makeHighlight("h3", "user-a", { startOffset: 10, endOffset: 20, highlightedText: "about polit" }));
    await clusters.save(makeCluster({ highlightIds: ["h1", "h2", "h3"] }));

    await votes.save(makeVote({ id: "v1", highlightId: "h1", userId: "u1" }));
    await votes.save(makeVote({ id: "v2", highlightId: "h2", userId: "u2" }));
    await votes.save(makeVote({ id: "v3", highlightId: "h3", userId: "u3" }));

    const score = await scoring.calculateArticleScore("article-1");
    // 2 unique users * (3 agrees / 3 total) = 2.0, NOT 3.0
    expect(score).toBeCloseTo(2.0);
  });

  it("recalculateScore persists the computed score to the article", async () => {
    await articles.save(makeArticle());
    await highlights.save(makeHighlight("h1", "user-a"));
    await highlights.save(makeHighlight("h2", "user-b", { startOffset: 10, endOffset: 20, highlightedText: "about polit" }));
    await clusters.save(makeCluster());
    await votes.save(makeVote({ id: "v1", highlightId: "h1", userId: "u1" }));
    await votes.save(makeVote({ id: "v2", highlightId: "h1", userId: "u2" }));
    await votes.save(makeVote({ id: "v3", highlightId: "h2", userId: "u3" }));

    await scoring.recalculateScore("article-1");

    const article = await articles.findById("article-1");
    expect(article!.propagandaScore).toBeCloseTo(2.0);
  });
});
