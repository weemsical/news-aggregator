import request from "supertest";
import { createApp } from "../server/app";
import { InMemoryArticleRepository } from "../repositories/InMemoryArticleRepository";
import { InMemoryFlagRepository } from "../repositories/InMemoryFlagRepository";
import { Article } from "../types";

const testArticle: Article = {
  id: "article-1",
  title: "Test Article",
  body: ["Test body paragraph."],
  sourceTags: ["test"],
  sourceId: "test-source",
  url: "https://example.com/test",
  fetchedAt: 1740000000000,
};

describe("GET /api/articles/:id/flags", () => {
  it("returns empty array when no flags exist", async () => {
    const articles = new InMemoryArticleRepository();
    const flags = new InMemoryFlagRepository();
    await articles.save(testArticle);
    const app = createApp({ articles, flags });

    const res = await request(app).get("/api/articles/article-1/flags");
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it("returns flags for a specific article", async () => {
    const articles = new InMemoryArticleRepository();
    const flags = new InMemoryFlagRepository();
    await articles.save(testArticle);
    await flags.save({
      id: "flag-1",
      articleId: "article-1",
      highlightedText: "Test body",
      explanation: "Loaded language",
      timestamp: Date.now(),
    });
    const app = createApp({ articles, flags });

    const res = await request(app).get("/api/articles/article-1/flags");
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].highlightedText).toBe("Test body");
  });
});

describe("POST /api/articles/:id/flags", () => {
  it("creates a flag and returns it", async () => {
    const articles = new InMemoryArticleRepository();
    const flags = new InMemoryFlagRepository();
    await articles.save(testArticle);
    const app = createApp({ articles, flags });

    const res = await request(app)
      .post("/api/articles/article-1/flags")
      .send({ highlightedText: "Test body", explanation: "Loaded language" });

    expect(res.status).toBe(201);
    expect(res.body.highlightedText).toBe("Test body");
    expect(res.body.explanation).toBe("Loaded language");
    expect(res.body.articleId).toBe("article-1");
    expect(res.body.id).toBeTruthy();
    expect(res.body.timestamp).toBeTruthy();

    expect(await flags.count()).toBe(1);
  });

  it("returns 404 when article does not exist", async () => {
    const articles = new InMemoryArticleRepository();
    const flags = new InMemoryFlagRepository();
    const app = createApp({ articles, flags });

    const res = await request(app)
      .post("/api/articles/nonexistent/flags")
      .send({ highlightedText: "text", explanation: "reason" });

    expect(res.status).toBe(404);
  });

  it("returns 400 when highlightedText is missing", async () => {
    const articles = new InMemoryArticleRepository();
    const flags = new InMemoryFlagRepository();
    await articles.save(testArticle);
    const app = createApp({ articles, flags });

    const res = await request(app)
      .post("/api/articles/article-1/flags")
      .send({ explanation: "reason" });

    expect(res.status).toBe(400);
  });

  it("returns 400 when explanation is missing", async () => {
    const articles = new InMemoryArticleRepository();
    const flags = new InMemoryFlagRepository();
    await articles.save(testArticle);
    const app = createApp({ articles, flags });

    const res = await request(app)
      .post("/api/articles/article-1/flags")
      .send({ highlightedText: "text" });

    expect(res.status).toBe(400);
  });
});
