import request from "supertest";
import { createApp } from "../server/app";
import { InMemoryArticleRepository } from "../repositories/InMemoryArticleRepository";
import { InMemoryFlagRepository } from "../repositories/InMemoryFlagRepository";
import { InMemoryUserRepository } from "../repositories/InMemoryUserRepository";
import { InMemoryFeedSourceRepository } from "../repositories/InMemoryFeedSourceRepository";

function buildApp() {
  const articles = new InMemoryArticleRepository();
  const flags = new InMemoryFlagRepository();
  const users = new InMemoryUserRepository();
  const feedSources = new InMemoryFeedSourceRepository();
  const app = createApp({ articles, flags, users, feedSources });
  return { app, articles, flags, users, feedSources };
}

async function signupAndGetCookie(
  app: any,
  email = "admin@example.com"
) {
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

describe("GET /api/admin/feed-sources", () => {
  it("returns 401 when not authenticated", async () => {
    const { app } = buildApp();
    const res = await request(app).get("/api/admin/feed-sources");
    expect(res.status).toBe(401);
  });

  it("returns 403 when user is not admin", async () => {
    process.env.ADMIN_EMAILS = "other@example.com";
    const { app } = buildApp();
    const { cookie } = await signupAndGetCookie(app, "user@example.com");

    const res = await request(app)
      .get("/api/admin/feed-sources")
      .set("Cookie", cookie);
    expect(res.status).toBe(403);
  });

  it("returns all sources with isDynamic flags when admin", async () => {
    process.env.ADMIN_EMAILS = "admin@example.com";
    const { app, feedSources } = buildApp();
    await feedSources.save({
      sourceId: "custom",
      name: "Custom Source",
      feedUrl: "https://example.com/feed.xml",
      defaultTags: ["test"],
    });
    const { cookie } = await signupAndGetCookie(app);

    const res = await request(app)
      .get("/api/admin/feed-sources")
      .set("Cookie", cookie);

    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThan(8); // 8 static + 1 dynamic
    const custom = res.body.find(
      (s: any) => s.sourceId === "custom"
    );
    expect(custom).toBeDefined();
    expect(custom.isDynamic).toBe(true);

    const foxNews = res.body.find(
      (s: any) => s.sourceId === "fox-news"
    );
    expect(foxNews).toBeDefined();
    expect(foxNews.isDynamic).toBe(false);
  });
});

describe("POST /api/admin/feed-sources", () => {
  it("returns 401 when not authenticated", async () => {
    const { app } = buildApp();
    const res = await request(app)
      .post("/api/admin/feed-sources")
      .send({ sourceId: "x", name: "X", feedUrl: "https://x.com/feed" });
    expect(res.status).toBe(401);
  });

  it("returns 400 for missing required fields", async () => {
    process.env.ADMIN_EMAILS = "admin@example.com";
    const { app } = buildApp();
    const { cookie } = await signupAndGetCookie(app);

    const res1 = await request(app)
      .post("/api/admin/feed-sources")
      .set("Cookie", cookie)
      .send({ name: "X", feedUrl: "https://x.com/feed" });
    expect(res1.status).toBe(400);
    expect(res1.body.error).toMatch(/sourceId/);

    const res2 = await request(app)
      .post("/api/admin/feed-sources")
      .set("Cookie", cookie)
      .send({ sourceId: "x", feedUrl: "https://x.com/feed" });
    expect(res2.status).toBe(400);
    expect(res2.body.error).toMatch(/name/);

    const res3 = await request(app)
      .post("/api/admin/feed-sources")
      .set("Cookie", cookie)
      .send({ sourceId: "x", name: "X" });
    expect(res3.status).toBe(400);
    expect(res3.body.error).toMatch(/feedUrl/);
  });

  it("creates a feed source and returns 201", async () => {
    process.env.ADMIN_EMAILS = "admin@example.com";
    const { app, feedSources } = buildApp();
    const { cookie } = await signupAndGetCookie(app);

    const res = await request(app)
      .post("/api/admin/feed-sources")
      .set("Cookie", cookie)
      .send({
        sourceId: "new-source",
        name: "New Source",
        feedUrl: "https://new.com/feed.xml",
        defaultTags: ["news"],
      });

    expect(res.status).toBe(201);
    expect(res.body.sourceId).toBe("new-source");
    expect(res.body.name).toBe("New Source");

    const saved = await feedSources.findById("new-source");
    expect(saved).toBeDefined();
    expect(saved!.name).toBe("New Source");
  });
});

describe("DELETE /api/admin/feed-sources/:sourceId", () => {
  it("removes a dynamic source and returns 200", async () => {
    process.env.ADMIN_EMAILS = "admin@example.com";
    const { app, feedSources } = buildApp();
    await feedSources.save({
      sourceId: "to-delete",
      name: "Delete Me",
      feedUrl: "https://delete.com/feed.xml",
      defaultTags: [],
    });
    const { cookie } = await signupAndGetCookie(app);

    const res = await request(app)
      .delete("/api/admin/feed-sources/to-delete")
      .set("Cookie", cookie);

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(await feedSources.findById("to-delete")).toBeUndefined();
  });

  it("returns 404 for non-existent source", async () => {
    process.env.ADMIN_EMAILS = "admin@example.com";
    const { app } = buildApp();
    const { cookie } = await signupAndGetCookie(app);

    const res = await request(app)
      .delete("/api/admin/feed-sources/nonexistent")
      .set("Cookie", cookie);

    expect(res.status).toBe(404);
  });
});

describe("POST /api/admin/feed-sources/:sourceId/fetch", () => {
  it("returns 404 when source does not exist", async () => {
    process.env.ADMIN_EMAILS = "admin@example.com";
    const { app } = buildApp();
    const { cookie } = await signupAndGetCookie(app);

    const res = await request(app)
      .post("/api/admin/feed-sources/nonexistent/fetch")
      .set("Cookie", cookie);

    expect(res.status).toBe(404);
  });
});
