import request from "supertest";
import { buildTestApp } from "./helpers/buildTestApp";
import { Article } from "../types";

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

const testArticle2: Article = {
  ...testArticle,
  id: "article-2",
  rawArticleId: "article-2",
};

function makeHighlightPayload(offset: number) {
  return {
    paragraphIndex: 0,
    startOffset: offset,
    endOffset: offset + 2,
    highlightedText: "Te",
  };
}

async function signupAndGetCookie(app: any, email = "test@example.com") {
  const res = await request(app)
    .post("/api/auth/signup")
    .send({ email, password: "password123" });
  return { cookie: res.headers["set-cookie"], userId: res.body.id };
}

describe("Anonymous highlight rate limiting", () => {
  it("allows up to 20 anonymous highlights per article", async () => {
    const { app, articles } = buildTestApp();
    await articles.save(testArticle);

    for (let i = 0; i < 20; i++) {
      const res = await request(app)
        .post("/api/articles/article-1/highlights")
        .send(makeHighlightPayload(i));
      expect(res.status).toBe(201);
    }
  });

  it("rejects the 21st anonymous highlight for the same article", async () => {
    const { app, articles } = buildTestApp();
    await articles.save(testArticle);

    for (let i = 0; i < 20; i++) {
      await request(app)
        .post("/api/articles/article-1/highlights")
        .send(makeHighlightPayload(i));
    }

    const res = await request(app)
      .post("/api/articles/article-1/highlights")
      .send(makeHighlightPayload(20));

    expect(res.status).toBe(429);
  });

  it("does not rate-limit authenticated users", async () => {
    const { app, articles } = buildTestApp();
    await articles.save(testArticle);
    const { cookie } = await signupAndGetCookie(app);

    for (let i = 0; i < 25; i++) {
      const res = await request(app)
        .post("/api/articles/article-1/highlights")
        .set("Cookie", cookie)
        .send({ ...makeHighlightPayload(i), explanation: "Reason" });
      expect(res.status).toBe(201);
    }
  });

  it("tracks per-article limits independently", async () => {
    const { app, articles } = buildTestApp();
    await articles.save(testArticle);
    await articles.save(testArticle2);

    for (let i = 0; i < 20; i++) {
      await request(app)
        .post("/api/articles/article-1/highlights")
        .send(makeHighlightPayload(i));
    }

    const res = await request(app)
      .post("/api/articles/article-2/highlights")
      .send(makeHighlightPayload(0));

    expect(res.status).toBe(201);
  });
});
