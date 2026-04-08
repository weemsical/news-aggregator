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

describe("publish mode on feed sources", () => {
  it("POST /api/admin/feed-sources accepts publishMode", async () => {
    process.env.ADMIN_EMAILS = "admin@example.com";
    const { app, feedSources } = buildApp();
    const { cookie } = await signupAdmin(app);

    const res = await request(app)
      .post("/api/admin/feed-sources")
      .set("Cookie", cookie)
      .send({
        sourceId: "manual-src",
        name: "Manual Source",
        feedUrl: "https://example.com/feed.xml",
        defaultTags: ["news"],
        publishMode: "manual",
      });

    expect(res.status).toBe(201);
    expect(res.body.publishMode).toBe("manual");

    const saved = await feedSources.findById("manual-src");
    expect(saved!.publishMode).toBe("manual");
  });

  it("POST /api/admin/feed-sources defaults publishMode to auto", async () => {
    process.env.ADMIN_EMAILS = "admin@example.com";
    const { app, feedSources } = buildApp();
    const { cookie } = await signupAdmin(app);

    const res = await request(app)
      .post("/api/admin/feed-sources")
      .set("Cookie", cookie)
      .send({
        sourceId: "auto-src",
        name: "Auto Source",
        feedUrl: "https://example.com/feed.xml",
        defaultTags: [],
      });

    expect(res.status).toBe(201);
    expect(res.body.publishMode).toBe("auto");

    const saved = await feedSources.findById("auto-src");
    expect(saved!.publishMode).toBe("auto");
  });

  it("GET /api/admin/feed-sources returns publishMode", async () => {
    process.env.ADMIN_EMAILS = "admin@example.com";
    const { app, feedSources } = buildApp();
    await feedSources.save({
      sourceId: "manual-src",
      name: "Manual Source",
      feedUrl: "https://example.com/feed.xml",
      defaultTags: [],
      publishMode: "manual",
    });
    const { cookie } = await signupAdmin(app);

    const res = await request(app)
      .get("/api/admin/feed-sources")
      .set("Cookie", cookie);

    expect(res.status).toBe(200);
    const manual = res.body.find((s: any) => s.sourceId === "manual-src");
    expect(manual).toBeDefined();
    expect(manual.publishMode).toBe("manual");
  });

  it("PUT /api/admin/feed-sources/:sourceId updates publishMode", async () => {
    process.env.ADMIN_EMAILS = "admin@example.com";
    const { app, feedSources } = buildApp();
    await feedSources.save({
      sourceId: "src-1",
      name: "Source 1",
      feedUrl: "https://example.com/feed.xml",
      defaultTags: [],
      publishMode: "auto",
    });
    const { cookie } = await signupAdmin(app);

    const res = await request(app)
      .put("/api/admin/feed-sources/src-1")
      .set("Cookie", cookie)
      .send({ publishMode: "manual" });

    expect(res.status).toBe(200);
    expect(res.body.publishMode).toBe("manual");

    const saved = await feedSources.findById("src-1");
    expect(saved!.publishMode).toBe("manual");
  });

  it("PUT /api/admin/feed-sources/:sourceId returns 404 for unknown source", async () => {
    process.env.ADMIN_EMAILS = "admin@example.com";
    const { app } = buildApp();
    const { cookie } = await signupAdmin(app);

    const res = await request(app)
      .put("/api/admin/feed-sources/nonexistent")
      .set("Cookie", cookie)
      .send({ publishMode: "manual" });

    expect(res.status).toBe(404);
  });
});
