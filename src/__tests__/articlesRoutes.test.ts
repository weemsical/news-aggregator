import request from "supertest";
import { buildTestApp } from "@helpers";
import { Article } from "@types";

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
    expect(res.body.articles).toEqual([]);
    expect(res.body.total).toBe(0);
    expect(res.body.page).toBe(1);
    expect(res.body.pageSize).toBe(20);
  });

  it("returns anonymized articles (no sourceId or url)", async () => {
    const { app, articles } = buildTestApp();
    await articles.save(foxArticle);

    const res = await request(app).get("/api/articles");
    expect(res.status).toBe(200);
    expect(res.body.articles).toHaveLength(1);
    expect(res.body.articles[0].title).toBe("Senator Tells House Committee Key Details");
    expect(res.body.articles[0]).not.toHaveProperty("sourceId");
    expect(res.body.articles[0]).not.toHaveProperty("url");
  });

  it("returns articles ordered newest first by default", async () => {
    const { app, articles } = buildTestApp();
    await articles.save(foxArticle);
    await articles.save(cnnArticle);

    const res = await request(app).get("/api/articles");
    expect(res.body.articles[0].id).toBe("article-2");
    expect(res.body.articles[1].id).toBe("article-1");
  });

  it("sorts by propaganda score when sort=propaganda", async () => {
    const { app, articles } = buildTestApp();
    await articles.save({ ...foxArticle, propagandaScore: 10 });
    await articles.save({ ...cnnArticle, propagandaScore: 25 });

    const res = await request(app).get("/api/articles?sort=propaganda");
    expect(res.body.articles[0].id).toBe("article-2");
    expect(res.body.articles[0].propagandaScore).toBe(25);
    expect(res.body.articles[1].propagandaScore).toBe(10);
  });

  it("paginates with 20 per page", async () => {
    const { app, articles } = buildTestApp();
    for (let i = 0; i < 25; i++) {
      await articles.save({
        ...foxArticle,
        id: `article-${i}`,
        rawArticleId: `raw-${i}`,
        fetchedAt: 1740000000000 + i * 1000,
      });
    }

    const page1 = await request(app).get("/api/articles?page=1");
    expect(page1.body.articles).toHaveLength(20);
    expect(page1.body.total).toBe(25);
    expect(page1.body.page).toBe(1);

    const page2 = await request(app).get("/api/articles?page=2");
    expect(page2.body.articles).toHaveLength(5);
    expect(page2.body.page).toBe(2);
  });

  it("returns empty page for out-of-range page number", async () => {
    const { app, articles } = buildTestApp();
    await articles.save(foxArticle);

    const res = await request(app).get("/api/articles?page=100");
    expect(res.body.articles).toHaveLength(0);
    expect(res.body.total).toBe(1);
  });

  it("applies date-seeded shuffle for same-value tiebreaking", async () => {
    const { app, articles } = buildTestApp();
    // All same fetchedAt — order should be deterministic via hash
    for (let i = 0; i < 5; i++) {
      await articles.save({
        ...foxArticle,
        id: `article-${i}`,
        rawArticleId: `raw-${i}`,
        fetchedAt: 1740000000000,
      });
    }

    const res1 = await request(app).get("/api/articles");
    const res2 = await request(app).get("/api/articles");
    const ids1 = res1.body.articles.map((a: any) => a.id);
    const ids2 = res2.body.articles.map((a: any) => a.id);
    expect(ids1).toEqual(ids2); // Stable within same day
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
