import request from "supertest";
import { createApp } from "../server/app";
import { InMemoryArticleRepository } from "../repositories/InMemoryArticleRepository";
import { InMemoryFlagRepository } from "../repositories/InMemoryFlagRepository";
import { InMemoryUserRepository } from "../repositories/InMemoryUserRepository";

function buildApp() {
  return createApp({
    articles: new InMemoryArticleRepository(),
    flags: new InMemoryFlagRepository(),
    users: new InMemoryUserRepository(),
  });
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
});
