import request from "supertest";
import { buildTestApp } from "./helpers/buildTestApp";

function buildApp() {
  const { app } = buildTestApp();
  return app;
}

describe("POST /api/auth/signup", () => {
  it("creates a user and sets cookie", async () => {
    const app = buildApp();
    const res = await request(app)
      .post("/api/auth/signup")
      .send({ email: "test@example.com", password: "password123" });

    expect(res.status).toBe(201);
    expect(res.body.email).toBe("test@example.com");
    expect(res.body.id).toBeTruthy();
    expect(res.headers["set-cookie"]).toBeDefined();
  });

  it("returns 400 for invalid email", async () => {
    const app = buildApp();
    const res = await request(app)
      .post("/api/auth/signup")
      .send({ email: "bad", password: "password123" });
    expect(res.status).toBe(400);
  });

  it("returns 400 for short password", async () => {
    const app = buildApp();
    const res = await request(app)
      .post("/api/auth/signup")
      .send({ email: "test@example.com", password: "short" });
    expect(res.status).toBe(400);
  });

  it("returns 409 for duplicate email", async () => {
    const app = buildApp();
    await request(app)
      .post("/api/auth/signup")
      .send({ email: "test@example.com", password: "password123" });
    const res = await request(app)
      .post("/api/auth/signup")
      .send({ email: "test@example.com", password: "password456" });
    expect(res.status).toBe(409);
  });
});

describe("POST /api/auth/login", () => {
  it("logs in and sets cookie", async () => {
    const app = buildApp();
    await request(app)
      .post("/api/auth/signup")
      .send({ email: "test@example.com", password: "password123" });

    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "test@example.com", password: "password123" });

    expect(res.status).toBe(200);
    expect(res.body.email).toBe("test@example.com");
    expect(res.headers["set-cookie"]).toBeDefined();
  });

  it("returns 401 for wrong password", async () => {
    const app = buildApp();
    await request(app)
      .post("/api/auth/signup")
      .send({ email: "test@example.com", password: "password123" });

    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "test@example.com", password: "wrongpassword" });
    expect(res.status).toBe(401);
  });

  it("returns 401 for nonexistent email", async () => {
    const app = buildApp();
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "nobody@example.com", password: "password123" });
    expect(res.status).toBe(401);
  });

  it("returns 400 when email or password missing", async () => {
    const app = buildApp();
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "test@example.com" });
    expect(res.status).toBe(400);
  });
});

describe("POST /api/auth/logout", () => {
  it("clears the cookie", async () => {
    const app = buildApp();
    const res = await request(app).post("/api/auth/logout");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true });
  });
});

describe("GET /api/auth/me", () => {
  it("returns current user when authenticated", async () => {
    const app = buildApp();
    const signup = await request(app)
      .post("/api/auth/signup")
      .send({ email: "test@example.com", password: "password123" });

    const cookie = signup.headers["set-cookie"];
    const res = await request(app)
      .get("/api/auth/me")
      .set("Cookie", cookie);

    expect(res.status).toBe(200);
    expect(res.body.email).toBe("test@example.com");
  });

  it("returns 401 when not authenticated", async () => {
    const app = buildApp();
    const res = await request(app).get("/api/auth/me");
    expect(res.status).toBe(401);
  });

  it("returns 401 with invalid token", async () => {
    const app = buildApp();
    const res = await request(app)
      .get("/api/auth/me")
      .set("Cookie", "token=invalid-token");
    expect(res.status).toBe(401);
  });

  it("returns isAdmin true when user email is in ADMIN_EMAILS", async () => {
    const originalEnv = process.env.ADMIN_EMAILS;
    process.env.ADMIN_EMAILS = "test@example.com";

    const app = buildApp();
    const signupRes = await request(app)
      .post("/api/auth/signup")
      .send({ email: "test@example.com", password: "password123" });
    const cookie = signupRes.headers["set-cookie"];

    const res = await request(app)
      .get("/api/auth/me")
      .set("Cookie", cookie);

    expect(res.status).toBe(200);
    expect(res.body.isAdmin).toBe(true);

    if (originalEnv !== undefined) {
      process.env.ADMIN_EMAILS = originalEnv;
    } else {
      delete process.env.ADMIN_EMAILS;
    }
  });

  it("returns isAdmin false when user email is not in ADMIN_EMAILS", async () => {
    const originalEnv = process.env.ADMIN_EMAILS;
    process.env.ADMIN_EMAILS = "other@example.com";

    const app = buildApp();
    const signupRes = await request(app)
      .post("/api/auth/signup")
      .send({ email: "test@example.com", password: "password123" });
    const cookie = signupRes.headers["set-cookie"];

    const res = await request(app)
      .get("/api/auth/me")
      .set("Cookie", cookie);

    expect(res.status).toBe(200);
    expect(res.body.isAdmin).toBe(false);

    if (originalEnv !== undefined) {
      process.env.ADMIN_EMAILS = originalEnv;
    } else {
      delete process.env.ADMIN_EMAILS;
    }
  });
});
