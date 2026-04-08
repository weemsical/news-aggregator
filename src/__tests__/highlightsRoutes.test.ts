import request from "supertest";
import { buildTestApp } from "@helpers";
import { Article } from "@types";

const testArticle: Article = {
  id: "article-1",
  rawArticleId: "article-1",
  title: "Test Article",
  body: ["Test body paragraph.", "Second paragraph with more text."],
  sourceTags: ["test"],
  sourceId: "test-source",
  url: "https://example.com/test",
  fetchedAt: 1740000000000,
  reviewStatus: "approved",
  propagandaScore: 0,
};

function buildApp() {
  return buildTestApp();
}

async function signupAndGetCookie(app: any, email = "test@example.com") {
  const res = await request(app)
    .post("/api/auth/signup")
    .send({ email, password: "password123" });
  return { cookie: res.headers["set-cookie"], userId: res.body.id };
}

describe("GET /api/articles/:id/highlights", () => {
  it("returns empty array when no highlights exist", async () => {
    const { app, articles } = buildApp();
    await articles.save(testArticle);

    const res = await request(app).get("/api/articles/article-1/highlights");
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it("returns all highlights for article", async () => {
    const { app, articles, highlights } = buildApp();
    await articles.save(testArticle);
    await highlights.save({
      id: "h-1",
      articleId: "article-1",
      userId: "user-1",
      paragraphIndex: 0,
      startOffset: 0,
      endOffset: 4,
      highlightedText: "Test",
      explanation: "Loaded language",
      isEdited: false,
      originalExplanation: null,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    const res = await request(app).get("/api/articles/article-1/highlights");
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].highlightedText).toBe("Test");
  });

  it("filters highlights by userId query param", async () => {
    const { app, articles, highlights } = buildApp();
    await articles.save(testArticle);
    const now = Date.now();
    await highlights.save({
      id: "h-1", articleId: "article-1", userId: "user-1",
      paragraphIndex: 0, startOffset: 0, endOffset: 4,
      highlightedText: "Test", explanation: "Explanation",
      isEdited: false, originalExplanation: null, createdAt: now, updatedAt: now,
    });
    await highlights.save({
      id: "h-2", articleId: "article-1", userId: "user-2",
      paragraphIndex: 0, startOffset: 5, endOffset: 9,
      highlightedText: "body", explanation: "Explanation",
      isEdited: false, originalExplanation: null, createdAt: now, updatedAt: now,
    });

    const res = await request(app).get("/api/articles/article-1/highlights?userId=user-1");
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].highlightedText).toBe("Test");
  });

  it("works without authentication", async () => {
    const { app, articles } = buildApp();
    await articles.save(testArticle);

    const res = await request(app).get("/api/articles/article-1/highlights");
    expect(res.status).toBe(200);
  });
});

describe("POST /api/articles/:id/highlights", () => {
  it("creates a highlight when authenticated", async () => {
    const { app, articles, highlights } = buildApp();
    await articles.save(testArticle);
    const { cookie, userId } = await signupAndGetCookie(app);

    const res = await request(app)
      .post("/api/articles/article-1/highlights")
      .set("Cookie", cookie)
      .send({
        paragraphIndex: 0,
        startOffset: 0,
        endOffset: 4,
        highlightedText: "Test",
        explanation: "Loaded language",
      });

    expect(res.status).toBe(201);
    expect(res.body.highlightedText).toBe("Test");
    expect(res.body.explanation).toBe("Loaded language");
    expect(res.body.articleId).toBe("article-1");
    expect(res.body.userId).toBe(userId);
    expect(res.body.paragraphIndex).toBe(0);
    expect(res.body.startOffset).toBe(0);
    expect(res.body.endOffset).toBe(4);
    expect(res.body.isEdited).toBe(false);
    expect(res.body.id).toBeTruthy();

    expect(await highlights.count()).toBe(1);
  });

  it("creates an anonymous highlight when not authenticated", async () => {
    const { app, articles, highlights } = buildApp();
    await articles.save(testArticle);

    const res = await request(app)
      .post("/api/articles/article-1/highlights")
      .send({
        paragraphIndex: 0,
        startOffset: 0,
        endOffset: 4,
        highlightedText: "Test",
      });

    expect(res.status).toBe(201);
    expect(res.body.userId).toBe("anon");
    expect(res.body.explanation).toBe("");
    expect(res.body.highlightedText).toBe("Test");
    expect(res.body.articleId).toBe("article-1");
    expect(await highlights.count()).toBe(1);
  });

  it("allows anonymous highlight with empty explanation", async () => {
    const { app, articles } = buildApp();
    await articles.save(testArticle);

    const res = await request(app)
      .post("/api/articles/article-1/highlights")
      .send({
        paragraphIndex: 0,
        startOffset: 0,
        endOffset: 4,
        highlightedText: "Test",
        explanation: "",
      });

    expect(res.status).toBe(201);
    expect(res.body.userId).toBe("anon");
    expect(res.body.explanation).toBe("");
  });

  it("still requires explanation for authenticated users", async () => {
    const { app, articles } = buildApp();
    await articles.save(testArticle);
    const { cookie } = await signupAndGetCookie(app);

    const res = await request(app)
      .post("/api/articles/article-1/highlights")
      .set("Cookie", cookie)
      .send({
        paragraphIndex: 0,
        startOffset: 0,
        endOffset: 4,
        highlightedText: "Test",
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/explanation/i);
  });

  it("returns 404 when article does not exist", async () => {
    const { app } = buildApp();
    const { cookie } = await signupAndGetCookie(app);

    const res = await request(app)
      .post("/api/articles/nonexistent/highlights")
      .set("Cookie", cookie)
      .send({
        paragraphIndex: 0, startOffset: 0, endOffset: 4,
        highlightedText: "text", explanation: "reason",
      });

    expect(res.status).toBe(404);
  });

  it("returns 400 when paragraphIndex is missing", async () => {
    const { app, articles } = buildApp();
    await articles.save(testArticle);
    const { cookie } = await signupAndGetCookie(app);

    const res = await request(app)
      .post("/api/articles/article-1/highlights")
      .set("Cookie", cookie)
      .send({
        startOffset: 0, endOffset: 4,
        highlightedText: "Test", explanation: "reason",
      });

    expect(res.status).toBe(400);
  });

  it("returns 400 when startOffset >= endOffset", async () => {
    const { app, articles } = buildApp();
    await articles.save(testArticle);
    const { cookie } = await signupAndGetCookie(app);

    const res = await request(app)
      .post("/api/articles/article-1/highlights")
      .set("Cookie", cookie)
      .send({
        paragraphIndex: 0, startOffset: 5, endOffset: 3,
        highlightedText: "Test", explanation: "reason",
      });

    expect(res.status).toBe(400);
  });

  it("returns 400 when explanation is missing", async () => {
    const { app, articles } = buildApp();
    await articles.save(testArticle);
    const { cookie } = await signupAndGetCookie(app);

    const res = await request(app)
      .post("/api/articles/article-1/highlights")
      .set("Cookie", cookie)
      .send({
        paragraphIndex: 0, startOffset: 0, endOffset: 4,
        highlightedText: "Test",
      });

    expect(res.status).toBe(400);
  });

  it("returns 400 when highlightedText is missing", async () => {
    const { app, articles } = buildApp();
    await articles.save(testArticle);
    const { cookie } = await signupAndGetCookie(app);

    const res = await request(app)
      .post("/api/articles/article-1/highlights")
      .set("Cookie", cookie)
      .send({
        paragraphIndex: 0, startOffset: 0, endOffset: 4,
        explanation: "reason",
      });

    expect(res.status).toBe(400);
  });
});

describe("PUT /api/highlights/:id", () => {
  it("updates explanation and sets isEdited", async () => {
    const { app, articles, highlights } = buildApp();
    await articles.save(testArticle);
    const { cookie, userId } = await signupAndGetCookie(app);

    await highlights.save({
      id: "h-1", articleId: "article-1", userId,
      paragraphIndex: 0, startOffset: 0, endOffset: 4,
      highlightedText: "Test", explanation: "Original",
      isEdited: false, originalExplanation: null,
      createdAt: Date.now(), updatedAt: Date.now(),
    });

    const res = await request(app)
      .put("/api/highlights/h-1")
      .set("Cookie", cookie)
      .send({ explanation: "Updated explanation" });

    expect(res.status).toBe(200);
    expect(res.body.explanation).toBe("Updated explanation");
    expect(res.body.isEdited).toBe(true);
    expect(res.body.originalExplanation).toBe("Original");
  });

  it("returns 401 when not authenticated", async () => {
    const { app } = buildApp();

    const res = await request(app)
      .put("/api/highlights/h-1")
      .send({ explanation: "Updated" });

    expect(res.status).toBe(401);
  });

  it("returns 403 when not the owner", async () => {
    const { app, articles, highlights } = buildApp();
    await articles.save(testArticle);

    await highlights.save({
      id: "h-1", articleId: "article-1", userId: "other-user",
      paragraphIndex: 0, startOffset: 0, endOffset: 4,
      highlightedText: "Test", explanation: "Original",
      isEdited: false, originalExplanation: null,
      createdAt: Date.now(), updatedAt: Date.now(),
    });

    const { cookie } = await signupAndGetCookie(app);

    const res = await request(app)
      .put("/api/highlights/h-1")
      .set("Cookie", cookie)
      .send({ explanation: "Updated" });

    expect(res.status).toBe(403);
  });

  it("returns 403 when attempting to edit an anonymous highlight", async () => {
    const { app, articles, highlights } = buildApp();
    await articles.save(testArticle);

    await highlights.save({
      id: "h-anon", articleId: "article-1", userId: "anon",
      paragraphIndex: 0, startOffset: 0, endOffset: 4,
      highlightedText: "Test", explanation: "",
      isEdited: false, originalExplanation: null,
      createdAt: Date.now(), updatedAt: Date.now(),
    });

    const { cookie } = await signupAndGetCookie(app);

    const res = await request(app)
      .put("/api/highlights/h-anon")
      .set("Cookie", cookie)
      .send({ explanation: "Updated" });

    expect(res.status).toBe(403);
    expect(res.body.error).toMatch(/anonymous/i);
  });

  it("returns 404 when highlight not found", async () => {
    const { app } = buildApp();
    const { cookie } = await signupAndGetCookie(app);

    const res = await request(app)
      .put("/api/highlights/nonexistent")
      .set("Cookie", cookie)
      .send({ explanation: "Updated" });

    expect(res.status).toBe(404);
  });
});

describe("DELETE /api/highlights/:id", () => {
  it("deletes highlight when owner", async () => {
    const { app, articles, highlights } = buildApp();
    await articles.save(testArticle);
    const { cookie, userId } = await signupAndGetCookie(app);

    await highlights.save({
      id: "h-1", articleId: "article-1", userId,
      paragraphIndex: 0, startOffset: 0, endOffset: 4,
      highlightedText: "Test", explanation: "Explanation",
      isEdited: false, originalExplanation: null,
      createdAt: Date.now(), updatedAt: Date.now(),
    });

    const res = await request(app)
      .delete("/api/highlights/h-1")
      .set("Cookie", cookie);

    expect(res.status).toBe(204);
    expect(await highlights.count()).toBe(0);
  });

  it("returns 401 when not authenticated", async () => {
    const { app } = buildApp();

    const res = await request(app).delete("/api/highlights/h-1");
    expect(res.status).toBe(401);
  });

  it("returns 403 when not the owner", async () => {
    const { app, articles, highlights } = buildApp();
    await articles.save(testArticle);

    await highlights.save({
      id: "h-1", articleId: "article-1", userId: "other-user",
      paragraphIndex: 0, startOffset: 0, endOffset: 4,
      highlightedText: "Test", explanation: "Explanation",
      isEdited: false, originalExplanation: null,
      createdAt: Date.now(), updatedAt: Date.now(),
    });

    const { cookie } = await signupAndGetCookie(app);

    const res = await request(app)
      .delete("/api/highlights/h-1")
      .set("Cookie", cookie);

    expect(res.status).toBe(403);
  });

  it("returns 403 when attempting to delete an anonymous highlight", async () => {
    const { app, articles, highlights } = buildApp();
    await articles.save(testArticle);

    await highlights.save({
      id: "h-anon", articleId: "article-1", userId: "anon",
      paragraphIndex: 0, startOffset: 0, endOffset: 4,
      highlightedText: "Test", explanation: "",
      isEdited: false, originalExplanation: null,
      createdAt: Date.now(), updatedAt: Date.now(),
    });

    const { cookie } = await signupAndGetCookie(app);

    const res = await request(app)
      .delete("/api/highlights/h-anon")
      .set("Cookie", cookie);

    expect(res.status).toBe(403);
    expect(res.body.error).toMatch(/anonymous/i);
  });

  it("returns 404 when highlight not found", async () => {
    const { app } = buildApp();
    const { cookie } = await signupAndGetCookie(app);

    const res = await request(app)
      .delete("/api/highlights/nonexistent")
      .set("Cookie", cookie);

    expect(res.status).toBe(404);
  });
});
