import { loadSeedData } from "../server/seedLoader";
import { TestInMemoryArticleRepository, TestInMemoryRawArticleRepository } from "@helpers";
import { seedArticles } from "@data";

describe("loadSeedData", () => {
  it("loads seed articles into both repos when empty", async () => {
    const articles = new TestInMemoryArticleRepository();
    const rawArticles = new TestInMemoryRawArticleRepository();
    await loadSeedData({ articles, rawArticles });
    expect(await articles.count()).toBe(seedArticles.length);
    expect(await rawArticles.count()).toBe(seedArticles.length);
  });

  it("does not load seeds when repository already has articles", async () => {
    const articles = new TestInMemoryArticleRepository();
    const rawArticles = new TestInMemoryRawArticleRepository();
    await articles.save({
      id: "existing",
      rawArticleId: "existing",
      title: "Existing Article",
      body: ["Already here."],
      sourceTags: ["test"],
      sourceId: "test",
      url: "https://example.com",
      fetchedAt: Date.now(),
      reviewStatus: "approved",
      propagandaScore: 0,
    });
    await loadSeedData({ articles, rawArticles });
    expect(await articles.count()).toBe(1);
    expect(await rawArticles.count()).toBe(0);
  });
});
