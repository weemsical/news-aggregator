import request from "supertest";
import { buildTestApp } from "@helpers";
import { Article, Highlight } from "@types";
import { signToken } from "../server/auth";

const article: Article = {
  id: "article-1",
  rawArticleId: "raw-1",
  title: "Test Article",
  body: ["paragraph one about politics and propaganda in the news"],
  sourceTags: ["politics"],
  sourceId: "fox-news",
  url: "https://example.com/1",
  fetchedAt: 1740000000000,
  reviewStatus: "approved",
  propagandaScore: 0,
};

function makeHighlight(id: string, userId: string): Highlight {
  const now = Date.now();
  return {
    id,
    articleId: "article-1",
    userId,
    paragraphIndex: 0,
    startOffset: 0,
    endOffset: 10,
    highlightedText: "paragraph ",
    explanation: "propaganda detected",
    isEdited: false,
    originalExplanation: null,
    createdAt: now,
    updatedAt: now,
  };
}

describe("Scoring integration", () => {
  it("recalculates article score after a vote is cast", async () => {
    const { app, articles, highlights, highlightClusters } = buildTestApp();
    await articles.save(article);

    // Create 2 highlights and a cluster
    const h1 = makeHighlight("h1", "user-a");
    const h2 = makeHighlight("h2", "user-b");
    await highlights.save(h1);
    await highlights.save(h2);
    await highlightClusters.save({
      id: "cluster-1",
      articleId: "article-1",
      paragraphIndex: 0,
      highlightIds: ["h1", "h2"],
      agreementCount: 2,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Cast 3 agree votes from different users
    const voters = ["voter-1", "voter-2", "voter-3"];
    for (const voterId of voters) {
      const token = signToken(voterId);
      await request(app)
        .post("/api/highlights/h1/votes")
        .set("Cookie", `token=${token}`)
        .send({ voteType: "agree" })
        .expect(201);
    }

    // Article score should now be updated: 2 highlights * (3 agrees / 3 total) = 2.0
    const updated = await articles.findById("article-1");
    expect(updated!.propagandaScore).toBeCloseTo(2.0);
  });

  it("recalculates score when a vote flips", async () => {
    const { app, articles, highlights, highlightClusters, votes } = buildTestApp();
    await articles.save(article);

    const h1 = makeHighlight("h1", "user-a");
    const h2 = makeHighlight("h2", "user-b");
    await highlights.save(h1);
    await highlights.save(h2);
    await highlightClusters.save({
      id: "cluster-1",
      articleId: "article-1",
      paragraphIndex: 0,
      highlightIds: ["h1", "h2"],
      agreementCount: 2,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Cast 3 agree votes
    const voterTokens = ["voter-1", "voter-2", "voter-3"].map((id) => ({
      id,
      token: signToken(id),
    }));
    for (const { token } of voterTokens) {
      await request(app)
        .post("/api/highlights/h1/votes")
        .set("Cookie", `token=${token}`)
        .send({ voteType: "agree" })
        .expect(201);
    }

    // Flip voter-3 to disagree
    await request(app)
      .post("/api/highlights/h1/votes")
      .set("Cookie", `token=${voterTokens[2].token}`)
      .send({ voteType: "disagree", reason: "I changed my mind" })
      .expect(200);

    // Score: 2 * (2 agrees / 3 total) ≈ 1.333
    const updated = await articles.findById("article-1");
    expect(updated!.propagandaScore).toBeCloseTo(2 * (2 / 3));
  });

  it("recalculates score when a highlight is deleted", async () => {
    const { app, articles, highlights, highlightClusters, votes } = buildTestApp();
    await articles.save(article);

    // Create highlights and cluster
    const h1 = makeHighlight("h1", "user-a");
    const h2 = makeHighlight("h2", "user-b");
    await highlights.save(h1);
    await highlights.save(h2);
    await highlightClusters.save({
      id: "cluster-1",
      articleId: "article-1",
      paragraphIndex: 0,
      highlightIds: ["h1", "h2"],
      agreementCount: 2,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Add 3 votes to make cluster qualify
    for (let i = 1; i <= 3; i++) {
      await votes.save({
        id: `v${i}`,
        highlightId: "h1",
        userId: `voter-${i}`,
        voteType: "agree",
        reason: null,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    }

    // Verify score is non-zero
    let a = await articles.findById("article-1");
    expect(a!.propagandaScore).toBe(0); // Not yet recalculated via route

    // Delete h1 as user-a
    const tokenA = signToken("user-a");
    await request(app)
      .delete("/api/highlights/h1")
      .set("Cookie", `token=${tokenA}`)
      .expect(204);

    // After deletion, cluster should be gone (only 1 highlight left, clusters need 2+)
    // Score should be 0
    const updated = await articles.findById("article-1");
    expect(updated!.propagandaScore).toBe(0);
  });
});
