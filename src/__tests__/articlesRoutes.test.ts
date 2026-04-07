import request from "supertest";
import { buildTestApp } from "./helpers/buildTestApp";
import { Article } from "../types";

const foxArticle: Article = {
  id: "article-1",
  rawArticleId: "article-1",
  title: "Senator Tells House Committee Key Details",
  subtitle: "Top official testifies",
  body: ["The former official accused the committee.", "Second paragraph."],
  sourceTags: ["politics", "investigations"],
  sourceId: "fox-news",
  url: "https://foxnews.com/politics/senator-testimony",
  fetchedAt: 1740000000000,
  reviewStatus: "approved",
  propagandaScore: 0,
};

const cnnArticle: Article = {
  id: "article-2",
  rawArticleId: "article-2",
  title: "Major Policy Change Announced",
  body: ["The administration announced changes."],
  sourceTags: ["policy"],
  sourceId: "cnn",
  url: "https://cnn.com/politics/major-policy-change",
  fetchedAt: 1740100000000,
  reviewStatus: "approved",
  propagandaScore: 0,
};

describe("GET /api/articles", () => {
  it("returns empty array when no articles exist", async () => {
    const { app } = buildTestApp();

    const res = await request(app).get("/api/articles");
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it("returns anonymized articles (no sourceId or url)", async () => {
    const { app, articles } = buildTestApp();
    await articles.save(foxArticle);

    const res = await request(app).get("/api/articles");
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].title).toBe("Senator Tells House Committee Key Details");
    expect(res.body[0]).not.toHaveProperty("sourceId");
    expect(res.body[0]).not.toHaveProperty("url");
  });

  it("returns articles ordered newest first", async () => {
    const { app, articles } = buildTestApp();
    await articles.save(foxArticle);
    await articles.save(cnnArticle);

    const res = await request(app).get("/api/articles");
    expect(res.body[0].id).toBe("article-2");
    expect(res.body[1].id).toBe("article-1");
  });
});

describe("GET /api/articles/:id", () => {
  it("returns a single anonymized article", async () => {
    const { app, articles } = buildTestApp();
    await articles.save(foxArticle);

    const res = await request(app).get("/api/articles/article-1");
    expect(res.status).toBe(200);
    expect(res.body.title).toBe("Senator Tells House Committee Key Details");
    expect(res.body).not.toHaveProperty("sourceId");
  });

  it("returns 404 for non-existent article", async () => {
    const { app } = buildTestApp();

    const res = await request(app).get("/api/articles/nonexistent");
    expect(res.status).toBe(404);
  });
});
