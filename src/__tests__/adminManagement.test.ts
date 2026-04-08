import request from "supertest";
import { buildTestApp } from "@helpers";

const ORIGINAL_ADMIN_EMAILS = process.env.ADMIN_EMAILS;

beforeEach(() => {
  process.env.ADMIN_EMAILS = "admin@example.com";
});

afterEach(() => {
  if (ORIGINAL_ADMIN_EMAILS !== undefined) {
    process.env.ADMIN_EMAILS = ORIGINAL_ADMIN_EMAILS;
  } else {
    delete process.env.ADMIN_EMAILS;
  }
});

async function signupAndGetCookie(app: any, email: string) {
  const res = await request(app)
    .post("/api/auth/signup")
    .send({ email, password: "password123" });
  return { cookie: res.headers["set-cookie"], userId: res.body.id };
}

describe("Admin management", () => {
  it("env-seeded admin has isAdmin=true on /me", async () => {
    const { app } = buildTestApp();
    const { cookie } = await signupAndGetCookie(app, "admin@example.com");

    const res = await request(app)
      .get("/api/auth/me")
      .set("Cookie", cookie);

    expect(res.status).toBe(200);
    expect(res.body.isAdmin).toBe(true);
  });

  it("regular user has isAdmin=false on /me", async () => {
    const { app } = buildTestApp();
    const { cookie } = await signupAndGetCookie(app, "user@example.com");

    const res = await request(app)
      .get("/api/auth/me")
      .set("Cookie", cookie);

    expect(res.status).toBe(200);
    expect(res.body.isAdmin).toBe(false);
  });

  it("admin can list admins", async () => {
    const { app } = buildTestApp();
    const { cookie } = await signupAndGetCookie(app, "admin@example.com");

    const res = await request(app)
      .get("/api/admin/admins")
      .set("Cookie", cookie);

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].email).toBe("admin@example.com");
  });

  it("admin can promote another user to admin", async () => {
    const { app } = buildTestApp();
    const { cookie: adminCookie } = await signupAndGetCookie(app, "admin@example.com");
    const { userId: newUserId } = await signupAndGetCookie(app, "new@example.com");

    const res = await request(app)
      .post("/api/admin/admins")
      .set("Cookie", adminCookie)
      .send({ userId: newUserId });

    expect(res.status).toBe(200);
    expect(res.body.isAdmin).toBe(true);

    // Verify they now show up in admin list
    const listRes = await request(app)
      .get("/api/admin/admins")
      .set("Cookie", adminCookie);

    expect(listRes.body).toHaveLength(2);
  });

  it("promoted user can access admin routes", async () => {
    const { app } = buildTestApp();
    const { cookie: adminCookie } = await signupAndGetCookie(app, "admin@example.com");
    const { cookie: newCookie, userId: newUserId } = await signupAndGetCookie(app, "new@example.com");

    // Promote
    await request(app)
      .post("/api/admin/admins")
      .set("Cookie", adminCookie)
      .send({ userId: newUserId });

    // New admin can access admin routes
    const res = await request(app)
      .get("/api/admin/feed-sources")
      .set("Cookie", newCookie);

    expect(res.status).toBe(200);
  });

  it("admin can demote another admin", async () => {
    const { app } = buildTestApp();
    const { cookie: adminCookie } = await signupAndGetCookie(app, "admin@example.com");
    const { cookie: newCookie, userId: newUserId } = await signupAndGetCookie(app, "new@example.com");

    // Promote then demote
    await request(app)
      .post("/api/admin/admins")
      .set("Cookie", adminCookie)
      .send({ userId: newUserId });

    const res = await request(app)
      .delete(`/api/admin/admins/${newUserId}`)
      .set("Cookie", adminCookie);

    expect(res.status).toBe(200);
    expect(res.body.isAdmin).toBe(false);

    // Demoted user can no longer access admin routes
    const feedRes = await request(app)
      .get("/api/admin/feed-sources")
      .set("Cookie", newCookie);

    expect(feedRes.status).toBe(403);
  });

  it("non-admin cannot promote users", async () => {
    const { app } = buildTestApp();
    await signupAndGetCookie(app, "admin@example.com");
    const { cookie: userCookie, userId } = await signupAndGetCookie(app, "user@example.com");

    const res = await request(app)
      .post("/api/admin/admins")
      .set("Cookie", userCookie)
      .send({ userId });

    expect(res.status).toBe(403);
  });

  it("returns 404 when promoting nonexistent user", async () => {
    const { app } = buildTestApp();
    const { cookie } = await signupAndGetCookie(app, "admin@example.com");

    const res = await request(app)
      .post("/api/admin/admins")
      .set("Cookie", cookie)
      .send({ userId: "nonexistent" });

    expect(res.status).toBe(404);
  });

  it("returns 400 when neither email nor userId provided", async () => {
    const { app } = buildTestApp();
    const { cookie } = await signupAndGetCookie(app, "admin@example.com");

    const res = await request(app)
      .post("/api/admin/admins")
      .set("Cookie", cookie)
      .send({});

    expect(res.status).toBe(400);
  });

  it("admin can promote another user by email", async () => {
    const { app } = buildTestApp();
    const { cookie: adminCookie } = await signupAndGetCookie(app, "admin@example.com");
    await signupAndGetCookie(app, "new@example.com");

    const res = await request(app)
      .post("/api/admin/admins")
      .set("Cookie", adminCookie)
      .send({ email: "new@example.com" });

    expect(res.status).toBe(200);
    expect(res.body.isAdmin).toBe(true);
    expect(res.body.email).toBe("new@example.com");
  });

  it("returns 404 when promoting by nonexistent email", async () => {
    const { app } = buildTestApp();
    const { cookie } = await signupAndGetCookie(app, "admin@example.com");

    const res = await request(app)
      .post("/api/admin/admins")
      .set("Cookie", cookie)
      .send({ email: "nobody@example.com" });

    expect(res.status).toBe(404);
  });
});
