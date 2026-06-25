import {
  TestInMemoryHighlightRepository,
  TestInMemoryHighlightClusterRepository,
  TestInMemoryArticleRepository,
  TestInMemoryVoteRepository,
} from "@helpers";
import { HighlightService } from "../services/HighlightService";
import { ClusterService, ScoringService } from "@services";
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

describe("HighlightService", () => {
  let highlights: TestInMemoryHighlightRepository;
  let clusters: TestInMemoryHighlightClusterRepository;
  let articles: TestInMemoryArticleRepository;
  let votes: TestInMemoryVoteRepository;
  let clusterService: ClusterService;
  let scoringService: ScoringService;
  let service: HighlightService;

  beforeEach(() => {
    highlights = new TestInMemoryHighlightRepository();
    clusters = new TestInMemoryHighlightClusterRepository();
    articles = new TestInMemoryArticleRepository();
    votes = new TestInMemoryVoteRepository();
    clusterService = new ClusterService(highlights, clusters);
    scoringService = new ScoringService(clusters, votes, articles, highlights);
    service = new HighlightService(highlights, clusterService, scoringService);
  });

  it("saves a highlight and triggers cluster + score recalculation", async () => {
    await articles.save({
      id: "article-1", rawArticleId: "raw-1", title: "Test", body: ["paragraph text"],
      sourceTags: ["news"], sourceId: "src", url: "https://x.com/1",
      fetchedAt: Date.now(), reviewStatus: "approved", propagandaScore: 0,
    });

    const h = makeHighlight();
    await service.createHighlight(h);

    const saved = await highlights.findById("h1");
    expect(saved).toBeDefined();
    expect(saved!.id).toBe("h1");
  });

  it("skips cluster recalculation for anonymous highlights", async () => {
    const h = makeHighlight({ userId: "anon", explanation: "" });
    await service.createHighlight(h);

    const saved = await highlights.findById("h1");
    expect(saved).toBeDefined();
    const articleClusters = await clusters.findByArticle("article-1");
    expect(articleClusters.length).toBe(0);
  });

  it("deletes a highlight and triggers cluster + score recalculation", async () => {
    await articles.save({
      id: "article-1", rawArticleId: "raw-1", title: "Test", body: ["paragraph text"],
      sourceTags: ["news"], sourceId: "src", url: "https://x.com/1",
      fetchedAt: Date.now(), reviewStatus: "approved", propagandaScore: 0,
    });

    const h = makeHighlight();
    await highlights.save(h);

    const deleted = await service.deleteHighlight("h1");
    expect(deleted).toBe(true);

    const found = await highlights.findById("h1");
    expect(found).toBeUndefined();
  });

  it("returns false when deleting non-existent highlight", async () => {
    const deleted = await service.deleteHighlight("nonexistent");
    expect(deleted).toBe(false);
  });
});
