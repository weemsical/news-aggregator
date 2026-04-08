import request from "supertest";
import { buildTestApp } from "./helpers/buildTestApp";
import { Article, Highlight } from "@types";

const testArticle: Article = {
  id: "article-1",
  rawArticleId: "article-1",
  title: "Test Article",
  body: ["Test body paragraph with enough text for highlighting.", "Second paragraph."],
  sourceTags: ["test"],
  sourceId: "test-source",
  url: "https://example.com/test",
  fetchedAt: 1740000000000,
  reviewStatus: "approved",
  propagandaScore: 0,
};

const now = Date.now();

function makeHighlight(overrides: Partial<Highlight> = {}): Highlight {
  return {
    id: "h-1",
    articleId: "article-1",
    userId: "user-1",
    paragraphIndex: 0,
    startOffset: 0,
    endOffset: 10,
    highlightedText: "Test body ",
    explanation: "Loaded language",
    isEdited: false,
    originalExplanation: null,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

async function signupAndGetCookie(app: any, email = "test@example.com") {
  const res = await request(app)
    .post("/api/auth/signup")
    .send({ email, password: "password123" });
  return { cookie: res.headers["set-cookie"], userId: res.body.id };
}

describe("Highlight cluster recalculation", () => {
  it("creates a cluster when overlapping highlights are added", async () => {
    const { app, articles, highlights, highlightClusters } = buildTestApp();
    await articles.save(testArticle);

    // Pre-seed a highlight from user-1
    await highlights.save(makeHighlight({ id: "h-1", userId: "user-1", startOffset: 0, endOffset: 10 }));

    // Sign up as user-2 and create an overlapping highlight
    const { cookie } = await signupAndGetCookie(app, "user2@example.com");
    const res = await request(app)
      .post("/api/articles/article-1/highlights")
      .set("Cookie", cookie)
      .send({
        paragraphIndex: 0,
        startOffset: 0,
        endOffset: 10,
        highlightedText: "Test body ",
        explanation: "Same passage",
      });

    expect(res.status).toBe(201);

    // Check that a cluster was created
    const clusters = await highlightClusters.findByParagraph("article-1", 0);
    expect(clusters.length).toBe(1);
    expect(clusters[0].highlightIds).toHaveLength(2);
    expect(clusters[0].agreementCount).toBe(2);
  });

  it("does not create cluster for non-overlapping highlights", async () => {
    const { app, articles, highlights, highlightClusters } = buildTestApp();
    await articles.save(testArticle);

    // Pre-seed a highlight at start of paragraph
    await highlights.save(makeHighlight({ id: "h-1", userId: "user-1", startOffset: 0, endOffset: 5 }));

    // Sign up as user-2 and create a non-overlapping highlight
    const { cookie } = await signupAndGetCookie(app, "user2@example.com");
    await request(app)
      .post("/api/articles/article-1/highlights")
      .set("Cookie", cookie)
      .send({
        paragraphIndex: 0,
        startOffset: 30,
        endOffset: 40,
        highlightedText: "enough tex",
        explanation: "Different passage",
      });

    const clusters = await highlightClusters.findByParagraph("article-1", 0);
    expect(clusters.length).toBe(0);
  });

  it("does not include anonymous highlights in clusters", async () => {
    const { app, articles, highlights, highlightClusters } = buildTestApp();
    await articles.save(testArticle);

    // Pre-seed an anonymous highlight
    await highlights.save(makeHighlight({ id: "h-anon", userId: "anon", startOffset: 0, endOffset: 10 }));

    // Sign up and create a highlight at the same position
    const { cookie } = await signupAndGetCookie(app);
    await request(app)
      .post("/api/articles/article-1/highlights")
      .set("Cookie", cookie)
      .send({
        paragraphIndex: 0,
        startOffset: 0,
        endOffset: 10,
        highlightedText: "Test body ",
        explanation: "Loaded language",
      });

    // No cluster — only one non-anon highlight
    const clusters = await highlightClusters.findByParagraph("article-1", 0);
    expect(clusters.length).toBe(0);
  });

  it("recalculates clusters when a highlight is deleted", async () => {
    const { app, articles, highlights, highlightClusters } = buildTestApp();
    await articles.save(testArticle);

    // Create user and their highlight
    const { cookie, userId } = await signupAndGetCookie(app);

    // Pre-seed highlights from two other users at same spot
    await highlights.save(makeHighlight({ id: "h-other1", userId: "other-1", startOffset: 0, endOffset: 10 }));
    await highlights.save(makeHighlight({ id: "h-other2", userId: "other-2", startOffset: 0, endOffset: 10 }));

    // Create our highlight (triggers cluster with 3 members)
    const createRes = await request(app)
      .post("/api/articles/article-1/highlights")
      .set("Cookie", cookie)
      .send({
        paragraphIndex: 0,
        startOffset: 0,
        endOffset: 10,
        highlightedText: "Test body ",
        explanation: "Same spot",
      });
    const ourHighlightId = createRes.body.id;

    let clusters = await highlightClusters.findByParagraph("article-1", 0);
    expect(clusters.length).toBe(1);
    expect(clusters[0].highlightIds).toHaveLength(3);

    // Delete our highlight
    await request(app)
      .delete(`/api/highlights/${ourHighlightId}`)
      .set("Cookie", cookie);

    // Cluster should be recalculated to 2 members
    clusters = await highlightClusters.findByParagraph("article-1", 0);
    expect(clusters.length).toBe(1);
    expect(clusters[0].highlightIds).toHaveLength(2);
  });
});
