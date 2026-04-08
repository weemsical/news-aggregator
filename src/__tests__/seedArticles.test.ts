import { TestInMemoryArticleRepository, TestInMemoryHighlightRepository } from "@helpers";
import { anonymize } from "@services";
import { seedArticles } from "@data";

describe("Seed Articles", () => {
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
    const repo = new TestInMemoryArticleRepository();

    await repo.saveBatch(seedArticles);

    expect(await repo.count()).toBe(seedArticles.length);
  });

  it("should all be retrievable as anonymized articles", async () => {
    const repo = new TestInMemoryArticleRepository();
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

  it("should support highlighting passages from seed articles", async () => {
    const highlightRepo = new TestInMemoryHighlightRepository();
    const article = seedArticles[0];
    const now = Date.now();

    await highlightRepo.save({
      id: "seed-highlight-1",
      articleId: article.id,
      userId: "user-1",
      paragraphIndex: 0,
      startOffset: 0,
      endOffset: 60,
      highlightedText: article.body[0].substring(0, 60),
      explanation: "Testing propaganda highlighting with real article content",
      isEdited: false,
      originalExplanation: null,
      createdAt: now,
      updatedAt: now,
    });

    expect(await highlightRepo.count()).toBe(1);
    expect(await highlightRepo.findByArticle(article.id)).toHaveLength(1);
  });

  it("should support highlighting across multiple seed articles", async () => {
    const highlightRepo = new TestInMemoryHighlightRepository();
    const now = Date.now();

    for (let i = 0; i < 4; i++) {
      const article = seedArticles[i];
      await highlightRepo.save({
        id: `multi-highlight-${i}`,
        articleId: article.id,
        userId: "user-1",
        paragraphIndex: 0,
        startOffset: 0,
        endOffset: 60,
        highlightedText: article.body[0].substring(0, 60),
        explanation: `Highlighted passage from article ${i + 1}`,
        isEdited: false,
        originalExplanation: null,
        createdAt: now + i,
        updatedAt: now + i,
      });
    }

    expect(await highlightRepo.count()).toBe(4);
    for (const article of seedArticles.slice(0, 4)) {
      expect(await highlightRepo.findByArticle(article.id)).toHaveLength(1);
    }
  });

  it("should cover a range of topic tags", () => {
    const allTags = seedArticles.flatMap((a) => a.sourceTags);
    const uniqueTags = new Set(allTags);

    expect(uniqueTags.size).toBeGreaterThanOrEqual(8);
  });
});
