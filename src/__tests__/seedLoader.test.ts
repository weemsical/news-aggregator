import { loadSeedData } from "../server/seedLoader";
import { InMemoryArticleRepository } from "../repositories/InMemoryArticleRepository";
import { seedArticles } from "../data/seedArticles";

describe("loadSeedData", () => {
  it("loads seed articles when repository is empty", async () => {
    const repo = new InMemoryArticleRepository();
    await loadSeedData(repo);
    expect(await repo.count()).toBe(seedArticles.length);
  });

  it("does not load seeds when repository already has articles", async () => {
    const repo = new InMemoryArticleRepository();
    await repo.save({
      id: "existing",
      title: "Existing Article",
      body: ["Already here."],
      sourceTags: ["test"],
      sourceId: "test",
      url: "https://example.com",
      fetchedAt: Date.now(),
    });
    await loadSeedData(repo);
    expect(await repo.count()).toBe(1);
  });
});
