import request from "supertest";
import { buildTestApp } from "@helpers";
import { Article, Highlight } from "@types";

const testArticle: Article = {
  id: "article-1",
  rawArticleId: "article-1",
  title: "Test Article",
  body: ["Test body paragraph.", "Second paragraph."],
  sourceTags: ["test"],
  sourceId: "test-source",
  url: "https://example.com/test",
  fetchedAt: 1740000000000,
  reviewStatus: "approved",
  propagandaScore: 0,
};

const now = Date.now();

function makeHighlight(userId: string, id = "h-1"): Highlight {
  return {
    id,
    articleId: "article-1",
    userId,
    paragraphIndex: 0,
    startOffset: 0,
    endOffset: 4,
    highlightedText: "Test",
    explanation: "Loaded language",
    isEdited: false,
    originalExplanation: null,
    createdAt: now,
    updatedAt: now,
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

async function voteOnHighlight(app: any, highlightId: string, cookie: any) {
  await request(app)
    .post(`/api/highlights/${highlightId}/votes`)
    .set("Cookie", cookie)
    .send({ voteType: "agree" });
}

describe("POST /api/highlights/:id/comments", () => {
  it("creates a comment after voting", async () => {
    const { app, articles, highlights } = buildApp();
    await articles.save(testArticle);
    await highlights.save(makeHighlight("other-user"));
    const { cookie } = await signupAndGetCookie(app);
    await voteOnHighlight(app, "h-1", cookie);

    const res = await request(app)
      .post("/api/highlights/h-1/comments")
      .set("Cookie", cookie)
      .send({ text: "Good catch!" });

    expect(res.status).toBe(201);
    expect(res.body.text).toBe("Good catch!");
    expect(res.body.highlightId).toBe("h-1");
    expect(res.body.replyToId).toBeNull();
  });

  it("returns 403 when user has not voted", async () => {
    const { app, articles, highlights } = buildApp();
    await articles.save(testArticle);
    await highlights.save(makeHighlight("other-user"));
    const { cookie } = await signupAndGetCookie(app);

    const res = await request(app)
      .post("/api/highlights/h-1/comments")
      .set("Cookie", cookie)
      .send({ text: "Good catch!" });

    expect(res.status).toBe(403);
    expect(res.body.error).toMatch(/vote/i);
  });

  it("returns 401 when not authenticated", async () => {
    const { app, articles, highlights } = buildApp();
    await articles.save(testArticle);
    await highlights.save(makeHighlight("other-user"));

    const res = await request(app)
      .post("/api/highlights/h-1/comments")
      .send({ text: "Good catch!" });

    expect(res.status).toBe(401);
  });

  it("returns 400 when text exceeds 250 characters", async () => {
    const { app, articles, highlights } = buildApp();
    await articles.save(testArticle);
    await highlights.save(makeHighlight("other-user"));
    const { cookie } = await signupAndGetCookie(app);
    await voteOnHighlight(app, "h-1", cookie);

    const res = await request(app)
      .post("/api/highlights/h-1/comments")
      .set("Cookie", cookie)
      .send({ text: "a".repeat(251) });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/250/);
  });

  it("allows exactly 250 characters", async () => {
    const { app, articles, highlights } = buildApp();
    await articles.save(testArticle);
    await highlights.save(makeHighlight("other-user"));
    const { cookie } = await signupAndGetCookie(app);
    await voteOnHighlight(app, "h-1", cookie);

    const res = await request(app)
      .post("/api/highlights/h-1/comments")
      .set("Cookie", cookie)
      .send({ text: "a".repeat(250) });

    expect(res.status).toBe(201);
  });

  it("returns 400 when text is empty", async () => {
    const { app, articles, highlights } = buildApp();
    await articles.save(testArticle);
    await highlights.save(makeHighlight("other-user"));
    const { cookie } = await signupAndGetCookie(app);
    await voteOnHighlight(app, "h-1", cookie);

    const res = await request(app)
      .post("/api/highlights/h-1/comments")
      .set("Cookie", cookie)
      .send({ text: "" });

    expect(res.status).toBe(400);
  });

  it("returns 400 when thread is at 50 comments", async () => {
    const { app, articles, highlights, comments } = buildApp();
    await articles.save(testArticle);
    await highlights.save(makeHighlight("other-user"));
    const { cookie } = await signupAndGetCookie(app);
    await voteOnHighlight(app, "h-1", cookie);

    // Pre-fill 50 comments
    for (let i = 0; i < 50; i++) {
      await comments.save({
        id: `c-${i}`,
        highlightId: "h-1",
        userId: "some-user",
        text: `Comment ${i}`,
        replyToId: null,
        createdAt: now + i,
      });
    }

    const res = await request(app)
      .post("/api/highlights/h-1/comments")
      .set("Cookie", cookie)
      .send({ text: "One more" });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/50/);
  });

  it("includes warning when thread is at 45+ comments", async () => {
    const { app, articles, highlights, comments } = buildApp();
    await articles.save(testArticle);
    await highlights.save(makeHighlight("other-user"));
    const { cookie } = await signupAndGetCookie(app);
    await voteOnHighlight(app, "h-1", cookie);

    // Pre-fill 44 comments (so next will be 45th)
    for (let i = 0; i < 44; i++) {
      await comments.save({
        id: `c-${i}`,
        highlightId: "h-1",
        userId: "some-user",
        text: `Comment ${i}`,
        replyToId: null,
        createdAt: now + i,
      });
    }

    const res = await request(app)
      .post("/api/highlights/h-1/comments")
      .set("Cookie", cookie)
      .send({ text: "Almost full" });

    expect(res.status).toBe(201);
    expect(res.body.warning).toMatch(/45\/50/);
  });

  it("creates a reply to an existing comment", async () => {
    const { app, articles, highlights, comments } = buildApp();
    await articles.save(testArticle);
    await highlights.save(makeHighlight("other-user"));
    const { cookie } = await signupAndGetCookie(app);
    await voteOnHighlight(app, "h-1", cookie);

    // Create first comment
    const firstRes = await request(app)
      .post("/api/highlights/h-1/comments")
      .set("Cookie", cookie)
      .send({ text: "First comment" });

    const replyRes = await request(app)
      .post("/api/highlights/h-1/comments")
      .set("Cookie", cookie)
      .send({ text: "Reply", replyToId: firstRes.body.id });

    expect(replyRes.status).toBe(201);
    expect(replyRes.body.replyToId).toBe(firstRes.body.id);
  });

  it("returns 400 when reply target is from a different highlight thread", async () => {
    const { app, articles, highlights, comments } = buildApp();
    await articles.save(testArticle);
    await highlights.save(makeHighlight("other-user", "h-1"));
    await highlights.save(makeHighlight("other-user", "h-2"));
    const { cookie } = await signupAndGetCookie(app);
    await voteOnHighlight(app, "h-1", cookie);
    await voteOnHighlight(app, "h-2", cookie);

    // Create a comment on h-2
    await comments.save({
      id: "c-other-thread",
      highlightId: "h-2",
      userId: "some-user",
      text: "Comment on h-2",
      replyToId: null,
      createdAt: Date.now(),
    });

    // Try to reply to h-2's comment from h-1's thread
    const res = await request(app)
      .post("/api/highlights/h-1/comments")
      .set("Cookie", cookie)
      .send({ text: "Cross-thread reply", replyToId: "c-other-thread" });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/same thread/i);
  });

  it("returns 400 when reply target not found", async () => {
    const { app, articles, highlights } = buildApp();
    await articles.save(testArticle);
    await highlights.save(makeHighlight("other-user"));
    const { cookie } = await signupAndGetCookie(app);
    await voteOnHighlight(app, "h-1", cookie);

    const res = await request(app)
      .post("/api/highlights/h-1/comments")
      .set("Cookie", cookie)
      .send({ text: "Reply", replyToId: "nonexistent" });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/reply/i);
  });

  it("returns 404 when highlight not found", async () => {
    const { app } = buildApp();
    const { cookie } = await signupAndGetCookie(app);

    const res = await request(app)
      .post("/api/highlights/nonexistent/comments")
      .set("Cookie", cookie)
      .send({ text: "test" });

    expect(res.status).toBe(404);
  });
});

describe("GET /api/highlights/:id/comments", () => {
  it("returns flat chronological list", async () => {
    const { app, articles, highlights, comments } = buildApp();
    await articles.save(testArticle);
    await highlights.save(makeHighlight("other-user"));

    await comments.save({
      id: "c-1", highlightId: "h-1", userId: "user-1",
      text: "First", replyToId: null, createdAt: now,
    });
    await comments.save({
      id: "c-2", highlightId: "h-1", userId: "user-2",
      text: "Second", replyToId: null, createdAt: now + 1000,
    });

    const res = await request(app).get("/api/highlights/h-1/comments");

    expect(res.status).toBe(200);
    expect(res.body.comments).toHaveLength(2);
    expect(res.body.comments[0].text).toBe("First");
    expect(res.body.comments[1].text).toBe("Second");
    expect(res.body.total).toBe(2);
  });

  it("returns 404 when highlight not found", async () => {
    const { app } = buildApp();

    const res = await request(app).get("/api/highlights/nonexistent/comments");

    expect(res.status).toBe(404);
  });

  it("includes warning when at 45+ comments", async () => {
    const { app, articles, highlights, comments } = buildApp();
    await articles.save(testArticle);
    await highlights.save(makeHighlight("other-user"));

    for (let i = 0; i < 46; i++) {
      await comments.save({
        id: `c-${i}`, highlightId: "h-1", userId: "user-1",
        text: `Comment ${i}`, replyToId: null, createdAt: now + i,
      });
    }

    const res = await request(app).get("/api/highlights/h-1/comments");

    expect(res.status).toBe(200);
    expect(res.body.warning).toMatch(/46\/50/);
  });

  it("works without authentication", async () => {
    const { app, articles, highlights } = buildApp();
    await articles.save(testArticle);
    await highlights.save(makeHighlight("other-user"));

    const res = await request(app).get("/api/highlights/h-1/comments");

    expect(res.status).toBe(200);
    expect(res.body.comments).toEqual([]);
  });
});
