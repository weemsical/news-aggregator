import request from "supertest";
import { createApp } from "../server/app";
import { InMemoryArticleRepository } from "../repositories/InMemoryArticleRepository";
import { InMemoryFlagRepository } from "../repositories/InMemoryFlagRepository";
import { InMemoryUserRepository } from "../repositories/InMemoryUserRepository";
import { Article } from "../types";
import { signToken } from "../server/auth";

const testArticle: Article = {
  id: "article-1",
  title: "Test Article",
  body: ["Test body paragraph."],
  sourceTags: ["test"],
  sourceId: "test-source",
  url: "https://example.com/test",
  fetchedAt: 1740000000000,
};

function buildApp() {
  const articles = new InMemoryArticleRepository();
  const flags = new InMemoryFlagRepository();
  const users = new InMemoryUserRepository();
  const app = createApp({ articles, flags, users });
  return { app, articles, flags, users };
}

async function signupAndGetCookie(app: any) {
  const res = await request(app)
    .post("/api/auth/signup")
    .send({ email: "test@example.com", password: "password123" });
  return { cookie: res.headers["set-cookie"], userId: res.body.id };
}

describe("GET /api/articles/:id/flags", () => {
  it("returns empty array when no flags exist", async () => {
    const { app, articles } = buildApp();
    await articles.save(testArticle);

    const res = await request(app).get("/api/articles/article-1/flags");
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it("returns all flags for a specific article", async () => {
    const { app, articles, flags } = buildApp();
    await articles.save(testArticle);
    await flags.save({
      id: "flag-1",
      articleId: "article-1",
      userId: "user-1",
      highlightedText: "Test body",
      explanation: "Loaded language",
      timestamp: Date.now(),
    });

    const res = await request(app).get("/api/articles/article-1/flags");
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].highlightedText).toBe("Test body");
  });

  it("filters flags by userId query param", async () => {
    const { app, articles, flags } = buildApp();
    await articles.save(testArticle);
    await flags.save({
      id: "flag-1",
      articleId: "article-1",
      userId: "user-1",
      highlightedText: "User 1 flag",
      explanation: "Explanation",
      timestamp: Date.now(),
    });
    await flags.save({
      id: "flag-2",
      articleId: "article-1",
      userId: "user-2",
      highlightedText: "User 2 flag",
      explanation: "Explanation",
      timestamp: Date.now(),
    });

    const res = await request(app).get("/api/articles/article-1/flags?userId=user-1");
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].highlightedText).toBe("User 1 flag");
  });

  it("works without authentication (read-only)", async () => {
    const { app, articles } = buildApp();
    await articles.save(testArticle);

    const res = await request(app).get("/api/articles/article-1/flags");
    expect(res.status).toBe(200);
  });
});

describe("POST /api/articles/:id/flags", () => {
  it("creates a flag when authenticated", async () => {
    const { app, articles, flags } = buildApp();
    await articles.save(testArticle);
    const { cookie, userId } = await signupAndGetCookie(app);

    const res = await request(app)
      .post("/api/articles/article-1/flags")
      .set("Cookie", cookie)
      .send({ highlightedText: "Test body", explanation: "Loaded language" });

    expect(res.status).toBe(201);
    expect(res.body.highlightedText).toBe("Test body");
    expect(res.body.explanation).toBe("Loaded language");
    expect(res.body.articleId).toBe("article-1");
    expect(res.body.userId).toBe(userId);
    expect(res.body.id).toBeTruthy();
    expect(res.body.timestamp).toBeTruthy();

    expect(await flags.count()).toBe(1);
  });

  it("returns 401 when not authenticated", async () => {
    const { app, articles } = buildApp();
    await articles.save(testArticle);

    const res = await request(app)
      .post("/api/articles/article-1/flags")
      .send({ highlightedText: "Test body", explanation: "Loaded language" });

    expect(res.status).toBe(401);
  });

  it("returns 404 when article does not exist", async () => {
    const { app } = buildApp();
    const { cookie } = await signupAndGetCookie(app);

    const res = await request(app)
      .post("/api/articles/nonexistent/flags")
      .set("Cookie", cookie)
      .send({ highlightedText: "text", explanation: "reason" });

    expect(res.status).toBe(404);
  });

  it("returns 400 when highlightedText is missing", async () => {
    const { app, articles } = buildApp();
    await articles.save(testArticle);
    const { cookie } = await signupAndGetCookie(app);

    const res = await request(app)
      .post("/api/articles/article-1/flags")
      .set("Cookie", cookie)
      .send({ explanation: "reason" });

    expect(res.status).toBe(400);
  });

  it("returns 400 when explanation is missing", async () => {
    const { app, articles } = buildApp();
    await articles.save(testArticle);
    const { cookie } = await signupAndGetCookie(app);

    const res = await request(app)
      .post("/api/articles/article-1/flags")
      .set("Cookie", cookie)
      .send({ highlightedText: "text" });

    expect(res.status).toBe(400);
  });
});
