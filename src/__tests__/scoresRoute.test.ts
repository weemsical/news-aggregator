import request from "supertest";
import { buildTestApp } from "@helpers";
import { Article } from "@types";
import { signToken } from "../server/auth";

function makeArticle(overrides: Partial<Article> = {}): Article {
  return {
    id: "article-1",
    rawArticleId: "raw-1",
    title: "Test Article",
    body: ["paragraph"],
    sourceTags: ["politics"],
    sourceId: "fox-news",
    url: "https://example.com/1",
    fetchedAt: 1740000000000,
    reviewStatus: "approved",
    propagandaScore: 0,
    ...overrides,
  };
}

describe("GET /api/scores", () => {
  it("returns 401 when not authenticated", async () => {
    const { app } = buildTestApp();
    const res = await request(app).get("/api/scores");
    expect(res.status).toBe(401);
  });

  it("returns empty array when no articles exist", async () => {
    const { app, users } = buildTestApp();
    await users.save({ id: "u1", email: "a@b.com", passwordHash: "x", isAdmin: false, createdAt: Date.now() });
    const token = signToken("u1");

    const res = await request(app)
      .get("/api/scores")
      .set("Cookie", `token=${token}`);
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it("returns source scores sorted by totalScore DESC", async () => {
    const { app, articles, feedSources, users } = buildTestApp();
    await users.save({ id: "u1", email: "a@b.com", passwordHash: "x", isAdmin: false, createdAt: Date.now() });
    const token = signToken("u1");

    await feedSources.save({ sourceId: "fox-news", name: "Fox News", feedUrl: "http://x", defaultTags: [] });
    await feedSources.save({ sourceId: "cnn", name: "CNN", feedUrl: "http://y", defaultTags: [] });

    await articles.save(makeArticle({ id: "a1", sourceId: "fox-news", propagandaScore: 5.0 }));
    await articles.save(makeArticle({ id: "a2", sourceId: "fox-news", propagandaScore: 3.0 }));
    await articles.save(makeArticle({ id: "a3", sourceId: "cnn", propagandaScore: 2.0 }));

    const res = await request(app)
      .get("/api/scores")
      .set("Cookie", `token=${token}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
    expect(res.body[0].sourceId).toBe("fox-news");
    expect(res.body[0].sourceName).toBe("Fox News");
    expect(res.body[0].totalScore).toBeCloseTo(8.0);
    expect(res.body[0].averageScore).toBeCloseTo(4.0);
    expect(res.body[0].articleCount).toBe(2);
    expect(res.body[1].sourceId).toBe("cnn");
    expect(res.body[1].totalScore).toBeCloseTo(2.0);
  });

  it("filters by date range", async () => {
    const { app, articles, feedSources, users } = buildTestApp();
    await users.save({ id: "u1", email: "a@b.com", passwordHash: "x", isAdmin: false, createdAt: Date.now() });
    const token = signToken("u1");

    await feedSources.save({ sourceId: "fox-news", name: "Fox News", feedUrl: "http://x", defaultTags: [] });

    // Jan 1 2025
    await articles.save(makeArticle({ id: "a1", propagandaScore: 5.0, fetchedAt: new Date("2025-01-01").getTime() }));
    // Mar 1 2025
    await articles.save(makeArticle({ id: "a2", propagandaScore: 3.0, fetchedAt: new Date("2025-03-01").getTime() }));
    // Jun 1 2025
    await articles.save(makeArticle({ id: "a3", propagandaScore: 2.0, fetchedAt: new Date("2025-06-01").getTime() }));

    const res = await request(app)
      .get("/api/scores?from=2025-02-01&to=2025-04-01")
      .set("Cookie", `token=${token}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].totalScore).toBeCloseTo(3.0);
    expect(res.body[0].articleCount).toBe(1);
  });

  it("computes average score correctly", async () => {
    const { app, articles, feedSources, users } = buildTestApp();
    await users.save({ id: "u1", email: "a@b.com", passwordHash: "x", isAdmin: false, createdAt: Date.now() });
    const token = signToken("u1");

    await feedSources.save({ sourceId: "cnn", name: "CNN", feedUrl: "http://y", defaultTags: [] });
    await articles.save(makeArticle({ id: "a1", sourceId: "cnn", propagandaScore: 4.0 }));
    await articles.save(makeArticle({ id: "a2", sourceId: "cnn", propagandaScore: 6.0 }));
    await articles.save(makeArticle({ id: "a3", sourceId: "cnn", propagandaScore: 2.0 }));

    const res = await request(app)
      .get("/api/scores")
      .set("Cookie", `token=${token}`);

    expect(res.body[0].averageScore).toBeCloseTo(4.0);
    expect(res.body[0].articleCount).toBe(3);
  });

  it("omits sources with no articles in range", async () => {
    const { app, feedSources, users } = buildTestApp();
    await users.save({ id: "u1", email: "a@b.com", passwordHash: "x", isAdmin: false, createdAt: Date.now() });
    const token = signToken("u1");

    await feedSources.save({ sourceId: "fox-news", name: "Fox News", feedUrl: "http://x", defaultTags: [] });

    const res = await request(app)
      .get("/api/scores")
      .set("Cookie", `token=${token}`);

    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });
});
