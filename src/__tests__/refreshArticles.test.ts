import request from "supertest";
import { buildTestApp } from "@helpers";

// Mock fetchFeed
jest.mock("../services/RssFetcher", () => ({
  fetchFeed: jest.fn(),
}));

import { fetchFeed } from "../services/RssFetcher";
const mockFetchFeed = fetchFeed as jest.MockedFunction<typeof fetchFeed>;

const validRss = `<?xml version="1.0"?>
<rss version="2.0"><channel>
  <item><title>New Article</title><link>https://example.com/new</link><description>Fresh content</description></item>
</channel></rss>`;

function buildApp() {
  return buildTestApp();
}

async function signupAndGetCookie(app: any, email = "user@example.com") {
  const res = await request(app)
    .post("/api/auth/signup")
    .send({ email, password: "password123" });
  return { cookie: res.headers["set-cookie"], userId: res.body.id };
}

describe("POST /api/articles/refresh", () => {
  beforeEach(() => {
    mockFetchFeed.mockReset();
  });

  it("returns 401 when not authenticated", async () => {
    const { app } = buildApp();
    const res = await request(app).post("/api/articles/refresh");
    expect(res.status).toBe(401);
  });

  it("fetches all feeds and returns counts", async () => {
    const { app } = buildApp();
    const { cookie } = await signupAndGetCookie(app);

    mockFetchFeed.mockResolvedValue({ ok: true, xml: validRss });

    const res = await request(app)
      .post("/api/articles/refresh")
      .set("Cookie", cookie);

    expect(res.status).toBe(200);
    expect(res.body.totalArticlesSaved).toBeGreaterThanOrEqual(0);
    expect(typeof res.body.totalArticlesSaved).toBe("number");
  });

  it("saves new articles from feeds", async () => {
    const { app, articles } = buildApp();
    const { cookie } = await signupAndGetCookie(app);

    mockFetchFeed.mockResolvedValue({ ok: true, xml: validRss });

    const beforeCount = await articles.count();

    await request(app)
      .post("/api/articles/refresh")
      .set("Cookie", cookie);

    const afterCount = await articles.count();
    expect(afterCount).toBeGreaterThan(beforeCount);
  });
});
