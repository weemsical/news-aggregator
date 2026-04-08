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

describe("replacement rules admin routes", () => {
  describe("POST /api/admin/sources/:sourceId/rules", () => {
    it("returns 401 when not authenticated", async () => {
      const { app } = buildApp();
      const res = await request(app)
        .post("/api/admin/sources/fox-news/rules")
        .send({ pattern: "libtard", replacementText: "[removed]" });
      expect(res.status).toBe(401);
    });

    it("returns 403 when not admin", async () => {
      process.env.ADMIN_EMAILS = "other@example.com";
      const { app } = buildApp();
      const { cookie } = await signupAdmin(app, "user@example.com");

      const res = await request(app)
        .post("/api/admin/sources/fox-news/rules")
        .set("Cookie", cookie)
        .send({ pattern: "libtard", replacementText: "[removed]" });
      expect(res.status).toBe(403);
    });

    it("creates a replacement rule", async () => {
      process.env.ADMIN_EMAILS = "admin@example.com";
      const { app } = buildApp();
      const { cookie } = await signupAdmin(app);

      const res = await request(app)
        .post("/api/admin/sources/fox-news/rules")
        .set("Cookie", cookie)
        .send({ pattern: "libtard", replacementText: "[removed]" });

      expect(res.status).toBe(201);
      expect(res.body.pattern).toBe("libtard");
      expect(res.body.replacementText).toBe("[removed]");
      expect(res.body.sourceId).toBe("fox-news");
      expect(res.body.isRegex).toBe(false);
      expect(res.body.id).toBeDefined();
    });

    it("creates a regex rule", async () => {
      process.env.ADMIN_EMAILS = "admin@example.com";
      const { app } = buildApp();
      const { cookie } = await signupAdmin(app);

      const res = await request(app)
        .post("/api/admin/sources/fox-news/rules")
        .set("Cookie", cookie)
        .send({ pattern: "lib\\w+", replacementText: "[bias]", isRegex: true });

      expect(res.status).toBe(201);
      expect(res.body.isRegex).toBe(true);
    });

    it("returns 400 for missing pattern", async () => {
      process.env.ADMIN_EMAILS = "admin@example.com";
      const { app } = buildApp();
      const { cookie } = await signupAdmin(app);

      const res = await request(app)
        .post("/api/admin/sources/fox-news/rules")
        .set("Cookie", cookie)
        .send({ replacementText: "[removed]" });

      expect(res.status).toBe(400);
    });

    it("returns 400 for missing replacementText", async () => {
      process.env.ADMIN_EMAILS = "admin@example.com";
      const { app } = buildApp();
      const { cookie } = await signupAdmin(app);

      const res = await request(app)
        .post("/api/admin/sources/fox-news/rules")
        .set("Cookie", cookie)
        .send({ pattern: "libtard" });

      expect(res.status).toBe(400);
    });
  });

  describe("GET /api/admin/sources/:sourceId/rules", () => {
    it("returns rules for a source", async () => {
      process.env.ADMIN_EMAILS = "admin@example.com";
      const { app, replacementRules } = buildApp();
      const { cookie } = await signupAdmin(app);

      await replacementRules.save({
        id: "rule-1",
        sourceId: "fox-news",
        pattern: "libtard",
        replacementText: "[removed]",
        isRegex: false,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });

      const res = await request(app)
        .get("/api/admin/sources/fox-news/rules")
        .set("Cookie", cookie);

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(1);
      expect(res.body[0].pattern).toBe("libtard");
    });

    it("returns empty array for source with no rules", async () => {
      process.env.ADMIN_EMAILS = "admin@example.com";
      const { app } = buildApp();
      const { cookie } = await signupAdmin(app);

      const res = await request(app)
        .get("/api/admin/sources/fox-news/rules")
        .set("Cookie", cookie);

      expect(res.status).toBe(200);
      expect(res.body).toEqual([]);
    });
  });

  describe("PUT /api/admin/rules/:id", () => {
    it("updates a replacement rule", async () => {
      process.env.ADMIN_EMAILS = "admin@example.com";
      const { app, replacementRules } = buildApp();
      const { cookie } = await signupAdmin(app);

      await replacementRules.save({
        id: "rule-1",
        sourceId: "fox-news",
        pattern: "libtard",
        replacementText: "[removed]",
        isRegex: false,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });

      const res = await request(app)
        .put("/api/admin/rules/rule-1")
        .set("Cookie", cookie)
        .send({ pattern: "snowflake", replacementText: "[edited]" });

      expect(res.status).toBe(200);
      expect(res.body.pattern).toBe("snowflake");
      expect(res.body.replacementText).toBe("[edited]");
    });

    it("returns 404 for nonexistent rule", async () => {
      process.env.ADMIN_EMAILS = "admin@example.com";
      const { app } = buildApp();
      const { cookie } = await signupAdmin(app);

      const res = await request(app)
        .put("/api/admin/rules/nonexistent")
        .set("Cookie", cookie)
        .send({ pattern: "x", replacementText: "y" });

      expect(res.status).toBe(404);
    });
  });

  describe("DELETE /api/admin/rules/:id", () => {
    it("deletes a replacement rule", async () => {
      process.env.ADMIN_EMAILS = "admin@example.com";
      const { app, replacementRules } = buildApp();
      const { cookie } = await signupAdmin(app);

      await replacementRules.save({
        id: "rule-1",
        sourceId: "fox-news",
        pattern: "libtard",
        replacementText: "[removed]",
        isRegex: false,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });

      const res = await request(app)
        .delete("/api/admin/rules/rule-1")
        .set("Cookie", cookie);

      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(await replacementRules.findById("rule-1")).toBeUndefined();
    });

    it("returns 404 for nonexistent rule", async () => {
      process.env.ADMIN_EMAILS = "admin@example.com";
      const { app } = buildApp();
      const { cookie } = await signupAdmin(app);

      const res = await request(app)
        .delete("/api/admin/rules/nonexistent")
        .set("Cookie", cookie);

      expect(res.status).toBe(404);
    });
  });

  describe("POST /api/admin/sources/:sourceId/rules/preview", () => {
    it("previews rule matches against raw articles", async () => {
      process.env.ADMIN_EMAILS = "admin@example.com";
      const { app, rawArticles } = buildApp();
      const { cookie } = await signupAdmin(app);

      await rawArticles.save({
        id: "raw-1",
        title: "Test Article",
        body: ["The libtard agenda continues.", "Normal paragraph."],
        sourceId: "fox-news",
        url: "https://example.com/1",
        fetchedAt: Date.now(),
      });

      const res = await request(app)
        .post("/api/admin/sources/fox-news/rules/preview")
        .set("Cookie", cookie)
        .send({ pattern: "libtard", replacementText: "[removed]" });

      expect(res.status).toBe(200);
      expect(res.body.matches.length).toBeGreaterThan(0);
      expect(res.body.matches[0]).toMatchObject({
        original: expect.stringContaining("libtard"),
        replaced: expect.stringContaining("[removed]"),
      });
    });
  });
});
