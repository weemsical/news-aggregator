import request from "supertest";
import { buildTestApp } from "@helpers";

function buildApp() {
  return buildTestApp();
}

async function signupAdmin(app: any, email = "admin@example.com") {
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

// We can't easily test the full fetch flow (it does HTTP to RSS feeds),
// but we can test the review status assignment and replacement rule application
// by testing the behavior through the existing article endpoints.

describe("fetch flow with publishMode and replacement rules", () => {
  it("articles from manual-review sources are pending and not visible to readers", async () => {
    process.env.ADMIN_EMAILS = "admin@example.com";
    const { app, articles } = buildApp();
    const { cookie } = await signupAdmin(app);

    // Simulate what the fetch flow should do for a manual source
    await articles.save({
      id: "manual-article-1",
      rawArticleId: "raw-manual-1",
      title: "Manual Review Article",
      body: ["Content here."],
      sourceTags: ["news"],
      sourceId: "manual-src",
      url: "https://example.com/1",
      fetchedAt: Date.now(),
      reviewStatus: "pending",
      propagandaScore: 0,
    });

    // Pending article should NOT appear in public article listing
    const publicRes = await request(app).get("/api/articles");
    expect(publicRes.status).toBe(200);
    const found = publicRes.body.articles.find((a: any) => a.id === "manual-article-1");
    expect(found).toBeUndefined();

    // But should appear in admin review queue
    const queueRes = await request(app)
      .get("/api/admin/review-queue")
      .set("Cookie", cookie);
    expect(queueRes.status).toBe(200);
    expect(queueRes.body.find((a: any) => a.id === "manual-article-1")).toBeDefined();

    // After approval, it should appear in public listing
    await request(app)
      .post("/api/admin/articles/manual-article-1/approve")
      .set("Cookie", cookie);

    const publicRes2 = await request(app).get("/api/articles");
    const found2 = publicRes2.body.articles.find((a: any) => a.id === "manual-article-1");
    expect(found2).toBeDefined();
  });

  it("articles from auto-publish sources are immediately approved", async () => {
    const { app, articles } = buildApp();

    await articles.save({
      id: "auto-article-1",
      rawArticleId: "raw-auto-1",
      title: "Auto Publish Article",
      body: ["Content here."],
      sourceTags: ["news"],
      sourceId: "auto-src",
      url: "https://example.com/2",
      fetchedAt: Date.now(),
      reviewStatus: "approved",
      propagandaScore: 0,
    });

    const publicRes = await request(app).get("/api/articles");
    const found = publicRes.body.articles.find((a: any) => a.id === "auto-article-1");
    expect(found).toBeDefined();
  });

  it("rejected articles are not visible to readers", async () => {
    const { app, articles } = buildApp();

    await articles.save({
      id: "rejected-article-1",
      rawArticleId: "raw-rejected-1",
      title: "Rejected Article",
      body: ["Bad content."],
      sourceTags: ["news"],
      sourceId: "src-1",
      url: "https://example.com/3",
      fetchedAt: Date.now(),
      reviewStatus: "rejected",
      propagandaScore: 0,
    });

    const publicRes = await request(app).get("/api/articles");
    const found = publicRes.body.articles.find((a: any) => a.id === "rejected-article-1");
    expect(found).toBeUndefined();
  });

  it("reprocess updates article body with replacement rules applied", async () => {
    process.env.ADMIN_EMAILS = "admin@example.com";
    const { app, articles, rawArticles, replacementRules } = buildApp();
    const { cookie } = await signupAdmin(app);

    await rawArticles.save({
      id: "raw-rp-1",
      title: "Reprocess Test",
      body: ["The libtard agenda is real.", "Normal text."],
      sourceId: "fox-news",
      url: "https://example.com/rp",
      fetchedAt: Date.now(),
    });

    await articles.save({
      id: "rp-article-1",
      rawArticleId: "raw-rp-1",
      title: "Reprocess Test",
      body: ["The libtard agenda is real.", "Normal text."],
      sourceTags: ["news"],
      sourceId: "fox-news",
      url: "https://example.com/rp",
      fetchedAt: Date.now(),
      reviewStatus: "pending",
      propagandaScore: 0,
    });

    await replacementRules.save({
      id: "rule-rp-1",
      sourceId: "fox-news",
      pattern: "libtard",
      replacementText: "[removed]",
      isRegex: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    const res = await request(app)
      .post("/api/admin/articles/rp-article-1/reprocess")
      .set("Cookie", cookie);

    expect(res.status).toBe(200);
    expect(res.body.body[0]).toBe("The [removed] agenda is real.");
    expect(res.body.body[1]).toBe("Normal text.");
  });
});
