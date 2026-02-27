import { InMemoryArticleRepository } from "../repositories/InMemoryArticleRepository";
import { InMemoryFlagRepository } from "../repositories/InMemoryFlagRepository";
import { anonymize } from "../services/anonymize";
import { seedArticles } from "../data/seedArticles";

describe("Seed Articles", () => {
  /**
   * Integration tests using real-world-style articles from diverse sources.
   * Verifies that the seed data is well-formed and works correctly
   * through the repository layer in a realistic setting.
   */

  it("should contain a meaningful number of articles from diverse sources", () => {
    expect(seedArticles.length).toBeGreaterThanOrEqual(8);

    const uniqueSources = new Set(seedArticles.map((a) => a.sourceId));
    expect(uniqueSources.size).toBeGreaterThanOrEqual(6);
  });

  it("should have well-formed articles with multi-paragraph bodies", () => {
    seedArticles.forEach((article) => {
      expect(article.id).toBeTruthy();
      expect(article.title).toBeTruthy();
      expect(article.body.length).toBeGreaterThanOrEqual(3);
      article.body.forEach((paragraph) => {
        expect(paragraph.length).toBeGreaterThan(20);
      });
      expect(article.sourceTags.length).toBeGreaterThanOrEqual(1);
      expect(article.sourceId).toBeTruthy();
      expect(article.url).toContain("https://");
      expect(article.fetchedAt).toBeGreaterThan(0);
    });
  });

  it("should have unique ids across all articles", () => {
    const ids = seedArticles.map((a) => a.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("should all load into the article repository without errors", async () => {
    const repo = new InMemoryArticleRepository();

    await repo.saveBatch(seedArticles);

    expect(await repo.count()).toBe(seedArticles.length);
  });

  it("should all be retrievable as anonymized articles", async () => {
    const repo = new InMemoryArticleRepository();
    await repo.saveBatch(seedArticles);

    const all = await repo.findAll();
    const anonymized = all.map(anonymize);

    expect(anonymized).toHaveLength(seedArticles.length);
    anonymized.forEach((article) => {
      expect(article).not.toHaveProperty("sourceId");
      expect(article).not.toHaveProperty("url");
      expect(article.title).toBeTruthy();
      expect(article.body.length).toBeGreaterThanOrEqual(3);
    });
  });

  it("should support flagging passages from seed articles", async () => {
    const flagRepo = new InMemoryFlagRepository();
    const article = seedArticles[0];

    await flagRepo.save({
      id: "seed-flag-1",
      articleId: article.id,
      highlightedText: article.body[0].substring(0, 60),
      explanation: "Testing propaganda flagging with real article content",
      timestamp: Date.now(),
    });

    expect(await flagRepo.count()).toBe(1);
    expect(await flagRepo.findByArticle(article.id)).toHaveLength(1);
  });

  it("should support flagging across multiple seed articles", async () => {
    const flagRepo = new InMemoryFlagRepository();

    for (let i = 0; i < 4; i++) {
      const article = seedArticles[i];
      await flagRepo.save({
        id: `multi-flag-${i}`,
        articleId: article.id,
        highlightedText: article.body[0].substring(0, 60),
        explanation: `Flagged passage from article ${i + 1}`,
        timestamp: Date.now() + i,
      });
    }

    expect(await flagRepo.count()).toBe(4);
    for (const article of seedArticles.slice(0, 4)) {
      expect(await flagRepo.findByArticle(article.id)).toHaveLength(1);
    }
  });

  it("should cover a range of topic tags", () => {
    const allTags = seedArticles.flatMap((a) => a.sourceTags);
    const uniqueTags = new Set(allTags);

    // Should cover a range of news topics
    expect(uniqueTags.size).toBeGreaterThanOrEqual(8);
  });
});
