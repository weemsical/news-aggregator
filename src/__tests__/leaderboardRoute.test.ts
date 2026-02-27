import request from "supertest";
import { createApp } from "../server/app";
import { InMemoryArticleRepository } from "../repositories/InMemoryArticleRepository";
import { InMemoryFlagRepository } from "../repositories/InMemoryFlagRepository";
import { InMemoryUserRepository } from "../repositories/InMemoryUserRepository";
import { InMemoryFeedSourceRepository } from "../repositories/InMemoryFeedSourceRepository";
import { Article, PropagandaFlag } from "../types";

function buildApp() {
  const articles = new InMemoryArticleRepository();
  const flags = new InMemoryFlagRepository();
  const users = new InMemoryUserRepository();
  const feedSources = new InMemoryFeedSourceRepository();
  const app = createApp({ articles, flags, users, feedSources });
  return { app, articles, flags, feedSources };
}

const foxArticle: Article = {
  id: "a-1",
  title: "Fox Article",
  body: ["Body text."],
  sourceTags: ["politics"],
  sourceId: "fox-news",
  url: "https://foxnews.com/article",
  fetchedAt: 1740000000000,
};

const cnnArticle: Article = {
  id: "a-2",
  title: "CNN Article",
  body: ["Body text."],
  sourceTags: ["politics"],
  sourceId: "cnn",
  url: "https://cnn.com/article",
  fetchedAt: 1740000000000,
};

const bbcArticle: Article = {
  id: "a-3",
  title: "BBC Article",
  body: ["Body text."],
  sourceTags: ["world"],
  sourceId: "bbc",
  url: "https://bbc.co.uk/article",
  fetchedAt: 1740000000000,
};

function makeFlag(id: string, articleId: string): PropagandaFlag {
  return {
    id,
    articleId,
    userId: "user-1",
    highlightedText: "some text",
    explanation: "propaganda",
    timestamp: Date.now(),
  };
}

describe("GET /api/leaderboard", () => {
  it("returns empty array when no flags exist", async () => {
    const { app } = buildApp();

    const res = await request(app).get("/api/leaderboard");
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it("returns sources sorted by flag count descending", async () => {
    const { app, articles, flags } = buildApp();
    await articles.save(foxArticle);
    await articles.save(cnnArticle);
    await flags.save(makeFlag("f-1", "a-1"));
    await flags.save(makeFlag("f-2", "a-1"));
    await flags.save(makeFlag("f-3", "a-2"));

    const res = await request(app).get("/api/leaderboard");
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
    expect(res.body[0]).toEqual({
      sourceId: "fox-news",
      sourceName: "Fox News",
      flagCount: 2,
    });
    expect(res.body[1]).toEqual({
      sourceId: "cnn",
      sourceName: "CNN",
      flagCount: 1,
    });
  });

  it("omits sources with zero flags", async () => {
    const { app, articles, flags } = buildApp();
    await articles.save(foxArticle);
    await articles.save(cnnArticle);
    await flags.save(makeFlag("f-1", "a-1"));

    const res = await request(app).get("/api/leaderboard");
    expect(res.body).toHaveLength(1);
    expect(res.body[0].sourceId).toBe("fox-news");
  });

  it("uses correct source names from feedSources", async () => {
    const { app, articles, flags } = buildApp();
    await articles.save(bbcArticle);
    await flags.save(makeFlag("f-1", "a-3"));

    const res = await request(app).get("/api/leaderboard");
    expect(res.body[0].sourceName).toBe("BBC News");
  });

  it("aggregates flags across multiple articles from the same source", async () => {
    const { app, articles, flags } = buildApp();
    const foxArticle2: Article = {
      ...foxArticle,
      id: "a-4",
      title: "Another Fox Article",
    };
    await articles.save(foxArticle);
    await articles.save(foxArticle2);
    await flags.save(makeFlag("f-1", "a-1"));
    await flags.save(makeFlag("f-2", "a-4"));

    const res = await request(app).get("/api/leaderboard");
    expect(res.body).toHaveLength(1);
    expect(res.body[0]).toEqual({
      sourceId: "fox-news",
      sourceName: "Fox News",
      flagCount: 2,
    });
  });
});
