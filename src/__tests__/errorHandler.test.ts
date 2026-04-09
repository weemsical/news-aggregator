import express from "express";
import request from "supertest";
import { asyncHandler } from "../server/middleware/asyncHandler";
import { errorHandler } from "../server/middleware/errorHandler";

function buildTestApp() {
  const app = express();
  app.use(express.json());

  app.get(
    "/ok",
    asyncHandler(async (_req, res) => {
      res.json({ status: "ok" });
    })
  );

  app.get(
    "/throw",
    asyncHandler(async () => {
      throw new Error("Something broke");
    })
  );

  app.get(
    "/throw-string",
    asyncHandler(async () => {
      throw "string error";
    })
  );

  app.use(errorHandler);
  return app;
}

describe("asyncHandler + errorHandler", () => {
  it("passes through successful responses unchanged", async () => {
    const app = buildTestApp();
    const res = await request(app).get("/ok");
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("ok");
  });

  it("catches thrown errors and returns 500 with message", async () => {
    const app = buildTestApp();
    const res = await request(app).get("/throw");
    expect(res.status).toBe(500);
    expect(res.body.error).toBe("Internal server error");
  });

  it("handles non-Error throws", async () => {
    const app = buildTestApp();
    const res = await request(app).get("/throw-string");
    expect(res.status).toBe(500);
    expect(res.body.error).toBe("Internal server error");
  });
});
