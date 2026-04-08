import request from "supertest";
import { buildTestApp } from "./helpers/buildTestApp";
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

describe("POST /api/highlights/:id/votes", () => {
  it("creates an agree vote", async () => {
    const { app, articles, highlights } = buildApp();
    await articles.save(testArticle);
    await highlights.save(makeHighlight("other-user"));
    const { cookie } = await signupAndGetCookie(app);

    const res = await request(app)
      .post("/api/highlights/h-1/votes")
      .set("Cookie", cookie)
      .send({ voteType: "agree" });

    expect(res.status).toBe(201);
    expect(res.body.voteType).toBe("agree");
    expect(res.body.highlightId).toBe("h-1");
    expect(res.body.reason).toBeNull();
  });

  it("creates a disagree vote with reason", async () => {
    const { app, articles, highlights } = buildApp();
    await articles.save(testArticle);
    await highlights.save(makeHighlight("other-user"));
    const { cookie } = await signupAndGetCookie(app);

    const res = await request(app)
      .post("/api/highlights/h-1/votes")
      .set("Cookie", cookie)
      .send({ voteType: "disagree", reason: "This is not propaganda" });

    expect(res.status).toBe(201);
    expect(res.body.voteType).toBe("disagree");
    expect(res.body.reason).toBe("This is not propaganda");
  });

  it("returns 400 when disagreeing without reason", async () => {
    const { app, articles, highlights } = buildApp();
    await articles.save(testArticle);
    await highlights.save(makeHighlight("other-user"));
    const { cookie } = await signupAndGetCookie(app);

    const res = await request(app)
      .post("/api/highlights/h-1/votes")
      .set("Cookie", cookie)
      .send({ voteType: "disagree" });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/reason/i);
  });

  it("returns 403 when voting on own highlight", async () => {
    const { app, articles, highlights } = buildApp();
    await articles.save(testArticle);
    const { cookie, userId } = await signupAndGetCookie(app);
    await highlights.save(makeHighlight(userId));

    const res = await request(app)
      .post("/api/highlights/h-1/votes")
      .set("Cookie", cookie)
      .send({ voteType: "agree" });

    expect(res.status).toBe(403);
    expect(res.body.error).toMatch(/own/i);
  });

  it("returns 401 when not authenticated", async () => {
    const { app, articles, highlights } = buildApp();
    await articles.save(testArticle);
    await highlights.save(makeHighlight("other-user"));

    const res = await request(app)
      .post("/api/highlights/h-1/votes")
      .send({ voteType: "agree" });

    expect(res.status).toBe(401);
  });

  it("returns 400 for invalid voteType", async () => {
    const { app, articles, highlights } = buildApp();
    await articles.save(testArticle);
    await highlights.save(makeHighlight("other-user"));
    const { cookie } = await signupAndGetCookie(app);

    const res = await request(app)
      .post("/api/highlights/h-1/votes")
      .set("Cookie", cookie)
      .send({ voteType: "neutral" });

    expect(res.status).toBe(400);
  });

  it("returns 404 when highlight not found", async () => {
    const { app } = buildApp();
    const { cookie } = await signupAndGetCookie(app);

    const res = await request(app)
      .post("/api/highlights/nonexistent/votes")
      .set("Cookie", cookie)
      .send({ voteType: "agree" });

    expect(res.status).toBe(404);
  });

  it("flips an existing vote (agree to disagree)", async () => {
    const { app, articles, highlights, votes } = buildApp();
    await articles.save(testArticle);
    await highlights.save(makeHighlight("other-user"));
    const { cookie, userId } = await signupAndGetCookie(app);

    // First vote: agree
    await request(app)
      .post("/api/highlights/h-1/votes")
      .set("Cookie", cookie)
      .send({ voteType: "agree" });

    // Flip to disagree
    const res = await request(app)
      .post("/api/highlights/h-1/votes")
      .set("Cookie", cookie)
      .send({ voteType: "disagree", reason: "Changed my mind" });

    expect(res.status).toBe(200);
    expect(res.body.voteType).toBe("disagree");
    expect(res.body.reason).toBe("Changed my mind");
    // Should still be only one vote
    expect(await votes.count()).toBe(1);
  });

  it("clears reason when flipping from disagree to agree", async () => {
    const { app, articles, highlights } = buildApp();
    await articles.save(testArticle);
    await highlights.save(makeHighlight("other-user"));
    const { cookie } = await signupAndGetCookie(app);

    // First vote: disagree with reason
    await request(app)
      .post("/api/highlights/h-1/votes")
      .set("Cookie", cookie)
      .send({ voteType: "disagree", reason: "Not propaganda" });

    // Flip to agree
    const res = await request(app)
      .post("/api/highlights/h-1/votes")
      .set("Cookie", cookie)
      .send({ voteType: "agree" });

    expect(res.status).toBe(200);
    expect(res.body.voteType).toBe("agree");
    expect(res.body.reason).toBeNull();
  });

  it("upserts — does not create duplicate votes", async () => {
    const { app, articles, highlights, votes } = buildApp();
    await articles.save(testArticle);
    await highlights.save(makeHighlight("other-user"));
    const { cookie } = await signupAndGetCookie(app);

    await request(app)
      .post("/api/highlights/h-1/votes")
      .set("Cookie", cookie)
      .send({ voteType: "agree" });

    await request(app)
      .post("/api/highlights/h-1/votes")
      .set("Cookie", cookie)
      .send({ voteType: "agree" });

    expect(await votes.count()).toBe(1);
  });
});

describe("GET /api/highlights/:id/votes", () => {
  it("returns vote counts and user vote", async () => {
    const { app, articles, highlights, votes } = buildApp();
    await articles.save(testArticle);
    await highlights.save(makeHighlight("other-user"));
    const { cookie, userId } = await signupAndGetCookie(app);

    // Cast a vote
    await request(app)
      .post("/api/highlights/h-1/votes")
      .set("Cookie", cookie)
      .send({ voteType: "agree" });

    const res = await request(app)
      .get("/api/highlights/h-1/votes")
      .set("Cookie", cookie);

    expect(res.status).toBe(200);
    expect(res.body.agrees).toBe(1);
    expect(res.body.disagrees).toBe(0);
    expect(res.body.userVote).toBe("agree");
  });

  it("returns null userVote when not authenticated", async () => {
    const { app, articles, highlights } = buildApp();
    await articles.save(testArticle);
    await highlights.save(makeHighlight("other-user"));

    const res = await request(app).get("/api/highlights/h-1/votes");

    expect(res.status).toBe(200);
    expect(res.body.agrees).toBe(0);
    expect(res.body.disagrees).toBe(0);
    expect(res.body.userVote).toBeNull();
  });

  it("returns 404 when highlight not found", async () => {
    const { app } = buildApp();

    const res = await request(app).get("/api/highlights/nonexistent/votes");

    expect(res.status).toBe(404);
  });
});
