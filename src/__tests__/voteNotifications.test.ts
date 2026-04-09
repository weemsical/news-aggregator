import request from "supertest";
import { buildTestApp } from "@helpers";

function buildApp() {
  return buildTestApp();
}

async function signupAndGetCookie(app: any, email: string) {
  const res = await request(app)
    .post("/api/auth/signup")
    .send({ email, password: "password123" });
  return { cookie: res.headers["set-cookie"], userId: res.body.id };
}

describe("vote notifications", () => {
  it("creates agreement notification when user agrees with highlight", async () => {
    const { app, articles, highlights, notifications } = buildApp();

    const { cookie: ownerCookie, userId: ownerId } = await signupAndGetCookie(app, "owner@test.com");
    const { cookie: voterCookie } = await signupAndGetCookie(app, "voter@test.com");

    await articles.save({
      id: "a1", rawArticleId: "raw-a1", title: "Test", body: ["Content"],
      sourceTags: ["news"], sourceId: "src", url: "https://x.com/1",
      fetchedAt: Date.now(), reviewStatus: "approved", propagandaScore: 0,
    });

    // Create highlight as owner
    const hlRes = await request(app)
      .post("/api/articles/a1/highlights")
      .set("Cookie", ownerCookie)
      .send({
        paragraphIndex: 0, startOffset: 0, endOffset: 7,
        highlightedText: "Content", explanation: "propaganda",
      });
    const highlightId = hlRes.body.id;

    // Vote as voter
    await request(app)
      .post(`/api/highlights/${highlightId}/votes`)
      .set("Cookie", voterCookie)
      .send({ voteType: "agree" });

    // Check owner got a notification
    const ownerNotifs = await notifications.findByUser(ownerId);
    expect(ownerNotifs.length).toBeGreaterThanOrEqual(1);
    expect(ownerNotifs.some((n) => n.type === "agreement")).toBe(true);
  });

  it("creates disagreement notification when user disagrees", async () => {
    const { app, articles, notifications } = buildApp();

    const { cookie: ownerCookie, userId: ownerId } = await signupAndGetCookie(app, "owner@test.com");
    const { cookie: voterCookie } = await signupAndGetCookie(app, "voter@test.com");

    await articles.save({
      id: "a1", rawArticleId: "raw-a1", title: "Test", body: ["Content"],
      sourceTags: ["news"], sourceId: "src", url: "https://x.com/1",
      fetchedAt: Date.now(), reviewStatus: "approved", propagandaScore: 0,
    });

    const hlRes = await request(app)
      .post("/api/articles/a1/highlights")
      .set("Cookie", ownerCookie)
      .send({
        paragraphIndex: 0, startOffset: 0, endOffset: 7,
        highlightedText: "Content", explanation: "propaganda",
      });
    const highlightId = hlRes.body.id;

    await request(app)
      .post(`/api/highlights/${highlightId}/votes`)
      .set("Cookie", voterCookie)
      .send({ voteType: "disagree", reason: "Not propaganda" });

    const ownerNotifs = await notifications.findByUser(ownerId);
    expect(ownerNotifs.some((n) => n.type === "disagreement")).toBe(true);
  });
});
