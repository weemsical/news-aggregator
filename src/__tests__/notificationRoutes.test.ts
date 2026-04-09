import request from "supertest";
import { buildTestApp } from "@helpers";

function buildApp() {
  return buildTestApp();
}

async function signupAndGetCookie(app: any, email = "user@example.com") {
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

describe("notification routes", () => {
  describe("GET /api/notifications", () => {
    it("returns 401 when not authenticated", async () => {
      const { app } = buildApp();
      const res = await request(app).get("/api/notifications");
      expect(res.status).toBe(401);
    });

    it("returns user notifications", async () => {
      const { app, notifications } = buildApp();
      const { cookie, userId } = await signupAndGetCookie(app);

      await notifications.save({
        id: "n1", userId, type: "agreement", referenceId: "h1",
        message: "Someone agreed", isRead: false, acknowledgedBy: [], createdAt: Date.now(),
      });
      await notifications.save({
        id: "n2", userId: "other-user", type: "agreement", referenceId: "h2",
        message: "Not yours", isRead: false, acknowledgedBy: [], createdAt: Date.now(),
      });

      const res = await request(app)
        .get("/api/notifications")
        .set("Cookie", cookie);

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(1);
      expect(res.body[0].id).toBe("n1");
    });
  });

  describe("GET /api/notifications/unread-count", () => {
    it("returns unread count", async () => {
      const { app, notifications } = buildApp();
      const { cookie, userId } = await signupAndGetCookie(app);

      await notifications.save({
        id: "n1", userId, type: "agreement", referenceId: "h1",
        message: "Unread", isRead: false, acknowledgedBy: [], createdAt: Date.now(),
      });
      await notifications.save({
        id: "n2", userId, type: "agreement", referenceId: "h2",
        message: "Read", isRead: true, acknowledgedBy: [], createdAt: Date.now(),
      });

      const res = await request(app)
        .get("/api/notifications/unread-count")
        .set("Cookie", cookie);

      expect(res.status).toBe(200);
      expect(res.body.count).toBe(1);
    });
  });

  describe("POST /api/notifications/:id/read", () => {
    it("marks notification as read", async () => {
      const { app, notifications } = buildApp();
      const { cookie, userId } = await signupAndGetCookie(app);

      await notifications.save({
        id: "n1", userId, type: "agreement", referenceId: "h1",
        message: "Unread", isRead: false, acknowledgedBy: [], createdAt: Date.now(),
      });

      const res = await request(app)
        .post("/api/notifications/n1/read")
        .set("Cookie", cookie);

      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);

      const n = await notifications.findById("n1");
      expect(n!.isRead).toBe(true);
    });

    it("returns 404 for nonexistent notification", async () => {
      const { app } = buildApp();
      const { cookie } = await signupAndGetCookie(app);

      const res = await request(app)
        .post("/api/notifications/nonexistent/read")
        .set("Cookie", cookie);

      expect(res.status).toBe(404);
    });
  });

  describe("POST /api/notifications/:id/acknowledge", () => {
    it("returns 403 for non-admin", async () => {
      process.env.ADMIN_EMAILS = "other@example.com";
      const { app } = buildApp();
      const { cookie } = await signupAndGetCookie(app);

      const res = await request(app)
        .post("/api/notifications/n1/acknowledge")
        .set("Cookie", cookie);

      expect(res.status).toBe(403);
    });

    it("acknowledges a feed failure notification", async () => {
      process.env.ADMIN_EMAILS = "admin@example.com";
      const { app, notifications } = buildApp();
      const { cookie, userId } = await signupAndGetCookie(app, "admin@example.com");

      await notifications.save({
        id: "n1", userId, type: "feed_failure", referenceId: "fox-news",
        message: "Feed failed", isRead: false, acknowledgedBy: [], createdAt: Date.now(),
      });

      const res = await request(app)
        .post("/api/notifications/n1/acknowledge")
        .set("Cookie", cookie);

      expect(res.status).toBe(200);
      expect(res.body.acknowledgedBy).toContain(userId);
    });
  });
});
