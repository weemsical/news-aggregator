import request from "supertest";
import { buildTestApp } from "@helpers";

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

async function signupAndGetCookie(app: any, email = "admin@example.com") {
  const res = await request(app)
    .post("/api/auth/signup")
    .send({ email, password: "password123" });
  return { cookie: res.headers["set-cookie"], userId: res.body.id };
}

const originalEnv = process.env.ADMIN_EMAILS;

afterEach(() => {
  if (originalEnv !== undefined) {
    process.env.ADMIN_EMAILS = originalEnv;
  } else {
    delete process.env.ADMIN_EMAILS;
  }
});

describe("POST /api/admin/refresh-all", () => {
  beforeEach(() => {
    mockFetchFeed.mockReset();
  });

  it("returns 401 when not authenticated", async () => {
    const { app } = buildApp();
    const res = await request(app).post("/api/admin/refresh-all");
    expect(res.status).toBe(401);
  });

  it("returns 403 when user is not admin", async () => {
    process.env.ADMIN_EMAILS = "other@example.com";
    const { app } = buildApp();
    const { cookie } = await signupAndGetCookie(app, "user@example.com");

    const res = await request(app)
      .post("/api/admin/refresh-all")
      .set("Cookie", cookie);
    expect(res.status).toBe(403);
  });

  it("returns articlesFound and newArticlesSaved when admin", async () => {
    process.env.ADMIN_EMAILS = "admin@example.com";
    const { app } = buildApp();
    const { cookie } = await signupAndGetCookie(app);

    mockFetchFeed.mockResolvedValue({ ok: true, xml: validRss });

    const res = await request(app)
      .post("/api/admin/refresh-all")
      .set("Cookie", cookie);

    expect(res.status).toBe(200);
    expect(typeof res.body.articlesFound).toBe("number");
    expect(typeof res.body.newArticlesSaved).toBe("number");
  });

  it("saves new articles from feeds", async () => {
    process.env.ADMIN_EMAILS = "admin@example.com";
    const { app, articles } = buildApp();
    const { cookie } = await signupAndGetCookie(app);

    mockFetchFeed.mockResolvedValue({ ok: true, xml: validRss });

    const beforeCount = await articles.count();

    await request(app)
      .post("/api/admin/refresh-all")
      .set("Cookie", cookie);

    const afterCount = await articles.count();
    expect(afterCount).toBeGreaterThan(beforeCount);
  });
});

describe("POST /api/articles/refresh", () => {
  it("no longer exists (returns 404)", async () => {
    const { app } = buildApp();
    const { cookie } = await signupAndGetCookie(app);

    const res = await request(app)
      .post("/api/articles/refresh")
      .set("Cookie", cookie);
    expect(res.status).toBe(404);
  });
});
