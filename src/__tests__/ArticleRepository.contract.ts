import { Article } from "../types";
import { ArticleRepository } from "../repositories/ArticleRepository";

export function articleRepositoryContractTests(
  createRepo: () => Promise<ArticleRepository>,
  cleanup?: () => Promise<void>
) {
  let repo: ArticleRepository;

  const foxArticle: Article = {
    id: "article-1",
    title: "Senator Tells House Committee Key Details",
    body: ["The former official accused the committee.", "Second paragraph."],
    sourceTags: ["politics", "investigations"],
    sourceId: "fox-news",
    url: "https://foxnews.com/politics/senator-testimony",
    fetchedAt: 1740000000000,
  };

  const cnnArticle: Article = {
    id: "article-2",
    title: "Major Policy Change Announced",
    subtitle: "Officials respond to new directive",
    body: ["The administration announced changes.", "Critics argue lack of oversight."],
    sourceTags: ["policy", "government"],
    sourceId: "cnn",
    url: "https://cnn.com/politics/major-policy-change",
    fetchedAt: 1740100000000,
  };

  beforeEach(async () => {
    repo = await createRepo();
  });

  afterEach(async () => {
    if (cleanup) await cleanup();
  });

  it("returns empty array when no articles exist", async () => {
    const all = await repo.findAll();
    expect(all).toEqual([]);
  });

  it("saves and retrieves an article by id", async () => {
    await repo.save(foxArticle);
    const found = await repo.findById("article-1");
    expect(found).toEqual(foxArticle);
  });

  it("returns undefined for a non-existent id", async () => {
    const found = await repo.findById("nonexistent");
    expect(found).toBeUndefined();
  });

  it("saves multiple articles and retrieves all", async () => {
    await repo.save(foxArticle);
    await repo.save(cnnArticle);
    const all = await repo.findAll();
    expect(all).toHaveLength(2);
  });

  it("supports saveBatch for multiple articles at once", async () => {
    await repo.saveBatch([foxArticle, cnnArticle]);
    const all = await repo.findAll();
    expect(all).toHaveLength(2);
  });

  it("does not create duplicates on repeated save", async () => {
    await repo.save(foxArticle);
    await repo.save(foxArticle);
    const all = await repo.findAll();
    expect(all).toHaveLength(1);
  });

  it("checks existence by id", async () => {
    await repo.save(foxArticle);
    expect(await repo.exists("article-1")).toBe(true);
    expect(await repo.exists("nonexistent")).toBe(false);
  });

  it("returns count of stored articles", async () => {
    expect(await repo.count()).toBe(0);
    await repo.save(foxArticle);
    expect(await repo.count()).toBe(1);
  });

  it("returns articles ordered by fetchedAt descending", async () => {
    await repo.save(foxArticle);  // fetchedAt: 1740000000000
    await repo.save(cnnArticle);  // fetchedAt: 1740100000000
    const all = await repo.findAll();
    expect(all[0].id).toBe("article-2");
    expect(all[1].id).toBe("article-1");
  });
}
