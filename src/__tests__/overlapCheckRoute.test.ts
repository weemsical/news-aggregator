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

function buildApp() {
  return buildTestApp();
}

async function signupAndGetCookie(app: any, email = "test@example.com") {
  const res = await request(app)
    .post("/api/auth/signup")
    .send({ email, password: "password123" });
  return { cookie: res.headers["set-cookie"], userId: res.body.id };
}

describe("GET /api/articles/:id/highlights/check-overlap", () => {
  it("returns overlapping highlights above 50% threshold", async () => {
    const { app, articles, highlights } = buildApp();
    await articles.save(testArticle);
    await highlights.save(makeHighlight({ id: "h-1", startOffset: 0, endOffset: 10 }));
    const { cookie } = await signupAndGetCookie(app);

    const res = await request(app)
      .get("/api/articles/article-1/highlights/check-overlap?paragraphIndex=0&startOffset=0&endOffset=10")
      .set("Cookie", cookie);

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].id).toBe("h-1");
  });

  it("excludes highlights below threshold", async () => {
    const { app, articles, highlights } = buildApp();
    await articles.save(testArticle);
    await highlights.save(makeHighlight({ id: "h-1", startOffset: 0, endOffset: 10 }));
    const { cookie } = await signupAndGetCookie(app);

    // Query span 8-20: overlap is 2 chars, shorter span is 10, 2/10 = 0.2 < 0.5
    const res = await request(app)
      .get("/api/articles/article-1/highlights/check-overlap?paragraphIndex=0&startOffset=8&endOffset=20")
      .set("Cookie", cookie);

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(0);
  });

  it("excludes anonymous highlights", async () => {
    const { app, articles, highlights } = buildApp();
    await articles.save(testArticle);
    await highlights.save(makeHighlight({ id: "h-anon", userId: "anon", startOffset: 0, endOffset: 10 }));
    const { cookie } = await signupAndGetCookie(app);

    const res = await request(app)
      .get("/api/articles/article-1/highlights/check-overlap?paragraphIndex=0&startOffset=0&endOffset=10")
      .set("Cookie", cookie);

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(0);
  });

  it("returns empty when no overlaps", async () => {
    const { app, articles } = buildApp();
    await articles.save(testArticle);
    const { cookie } = await signupAndGetCookie(app);

    const res = await request(app)
      .get("/api/articles/article-1/highlights/check-overlap?paragraphIndex=0&startOffset=0&endOffset=10")
      .set("Cookie", cookie);

    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it("ranks results by match percentage", async () => {
    const { app, articles, highlights } = buildApp();
    await articles.save(testArticle);
    // h-high: fully overlaps with query (0-10), shorter span = 10, 10/10 = 100%
    await highlights.save(makeHighlight({ id: "h-high", startOffset: 0, endOffset: 10 }));
    // h-low: partially overlaps (5-15), overlap = 5, shorter = 10, 5/10 = 50%
    await highlights.save(makeHighlight({ id: "h-low", userId: "user-2", startOffset: 5, endOffset: 15 }));
    const { cookie } = await signupAndGetCookie(app);

    const res = await request(app)
      .get("/api/articles/article-1/highlights/check-overlap?paragraphIndex=0&startOffset=0&endOffset=10")
      .set("Cookie", cookie);

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
    expect(res.body[0].id).toBe("h-high");
    expect(res.body[1].id).toBe("h-low");
  });

  it("requires authentication", async () => {
    const { app, articles } = buildApp();
    await articles.save(testArticle);

    const res = await request(app)
      .get("/api/articles/article-1/highlights/check-overlap?paragraphIndex=0&startOffset=0&endOffset=10");

    expect(res.status).toBe(401);
  });

  it("returns 404 when article not found", async () => {
    const { app } = buildApp();
    const { cookie } = await signupAndGetCookie(app);

    const res = await request(app)
      .get("/api/articles/nonexistent/highlights/check-overlap?paragraphIndex=0&startOffset=0&endOffset=10")
      .set("Cookie", cookie);

    expect(res.status).toBe(404);
  });

  it("returns 400 when query params missing", async () => {
    const { app, articles } = buildApp();
    await articles.save(testArticle);
    const { cookie } = await signupAndGetCookie(app);

    const res = await request(app)
      .get("/api/articles/article-1/highlights/check-overlap")
      .set("Cookie", cookie);

    expect(res.status).toBe(400);
  });
});
