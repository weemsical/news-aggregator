import request from "supertest";
import { buildTestApp } from "@helpers";

describe("GET /api/leaderboard", () => {
  it("returns empty array (stubbed for Phase 4)", async () => {
    const { app } = buildTestApp();

    const res = await request(app).get("/api/leaderboard");
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });
});
