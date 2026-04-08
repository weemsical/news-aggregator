import request from "supertest";
import { buildTestApp } from "@helpers";
import { Article } from "@types";

function buildApp() {
  return buildTestApp();
}

async function signupAdmin(app: any, email = "admin@example.com") {
  const res = await request(app)
    .post("/api/auth/signup")
    .send({ email, password: "password123" });
  return { cookie: res.headers["set-cookie"], userId: res.body.id };
}

function makePendingArticle(id: string, sourceId = "fox-news"): Article {
  return {
    id,
    rawArticleId: `raw-${id}`,
    title: `Article ${id}`,
    body: ["Paragraph one.", "Paragraph two."],
    sourceTags: ["news"],
    sourceId,
    url: `https://example.com/${id}`,
    fetchedAt: Date.now(),
    reviewStatus: "pending",
    propagandaScore: 0,
  };
}

const originalEnv = process.env.ADMIN_EMAILS;
afterEach(() => {
  if (originalEnv !== undefined) {
    process.env.ADMIN_EMAILS = originalEnv;
  } else {
    delete process.env.ADMIN_EMAILS;
  }
});

describe("review queue routes", () => {
  describe("GET /api/admin/review-queue", () => {
    it("returns 401 when not authenticated", async () => {
      const { app } = buildApp();
      const res = await request(app).get("/api/admin/review-queue");
      expect(res.status).toBe(401);
    });

    it("returns 403 when not admin", async () => {
      process.env.ADMIN_EMAILS = "other@example.com";
      const { app } = buildApp();
      const { cookie } = await signupAdmin(app, "user@example.com");

      const res = await request(app)
        .get("/api/admin/review-queue")
        .set("Cookie", cookie);
      expect(res.status).toBe(403);
    });

    it("returns pending articles", async () => {
      process.env.ADMIN_EMAILS = "admin@example.com";
      const { app, articles } = buildApp();
      await articles.save(makePendingArticle("pending-1"));
      await articles.save({
        ...makePendingArticle("approved-1"),
        reviewStatus: "approved",
      });
      const { cookie } = await signupAdmin(app);

      const res = await request(app)
        .get("/api/admin/review-queue")
        .set("Cookie", cookie);

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(1);
      expect(res.body[0].id).toBe("pending-1");
    });
  });

  describe("POST /api/admin/articles/:id/approve", () => {
    it("approves a pending article", async () => {
      process.env.ADMIN_EMAILS = "admin@example.com";
      const { app, articles } = buildApp();
      await articles.save(makePendingArticle("pending-1"));
      const { cookie } = await signupAdmin(app);

      const res = await request(app)
        .post("/api/admin/articles/pending-1/approve")
        .set("Cookie", cookie);

      expect(res.status).toBe(200);
      expect(res.body.reviewStatus).toBe("approved");

      const article = await articles.findById("pending-1");
      expect(article!.reviewStatus).toBe("approved");
    });

    it("returns 404 for nonexistent article", async () => {
      process.env.ADMIN_EMAILS = "admin@example.com";
      const { app } = buildApp();
      const { cookie } = await signupAdmin(app);

      const res = await request(app)
        .post("/api/admin/articles/nonexistent/approve")
        .set("Cookie", cookie);

      expect(res.status).toBe(404);
    });
  });

  describe("POST /api/admin/articles/:id/reject", () => {
    it("rejects a pending article", async () => {
      process.env.ADMIN_EMAILS = "admin@example.com";
      const { app, articles } = buildApp();
      await articles.save(makePendingArticle("pending-1"));
      const { cookie } = await signupAdmin(app);

      const res = await request(app)
        .post("/api/admin/articles/pending-1/reject")
        .set("Cookie", cookie);

      expect(res.status).toBe(200);
      expect(res.body.reviewStatus).toBe("rejected");
    });
  });

  describe("POST /api/admin/articles/:id/reprocess", () => {
    it("re-applies replacement rules to raw article and returns preview", async () => {
      process.env.ADMIN_EMAILS = "admin@example.com";
      const { app, articles, rawArticles, replacementRules } = buildApp();

      await rawArticles.save({
        id: "raw-pending-1",
        title: "Test Article",
        body: ["The libtard agenda continues.", "Normal paragraph."],
        sourceId: "fox-news",
        url: "https://example.com/1",
        fetchedAt: Date.now(),
      });
      await articles.save(makePendingArticle("pending-1", "fox-news"));

      await replacementRules.save({
        id: "rule-1",
        sourceId: "fox-news",
        pattern: "libtard",
        replacementText: "[removed]",
        isRegex: false,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });

      const { cookie } = await signupAdmin(app);

      const res = await request(app)
        .post("/api/admin/articles/pending-1/reprocess")
        .set("Cookie", cookie);

      expect(res.status).toBe(200);
      expect(res.body.body).toContain("The [removed] agenda continues.");
      expect(res.body.replacementMap.length).toBeGreaterThan(0);
    });

    it("returns 404 for nonexistent article", async () => {
      process.env.ADMIN_EMAILS = "admin@example.com";
      const { app } = buildApp();
      const { cookie } = await signupAdmin(app);

      const res = await request(app)
        .post("/api/admin/articles/nonexistent/reprocess")
        .set("Cookie", cookie);

      expect(res.status).toBe(404);
    });
  });
});
