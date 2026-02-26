import { Article } from "../types";
import { ArticleStore } from "../services/ArticleStore";
import { FlagStore } from "../services/FlagStore";
import { seedArticles } from "../data/seedArticles";

describe("Seed Articles", () => {
  /**
   * Integration tests using real-world-style articles from diverse sources.
   * Verifies that the seed data is well-formed and works correctly
   * through ArticleStore and FlagStore in a realistic setting.
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

  it("should all load into ArticleStore without errors", () => {
    const store = new ArticleStore();

    seedArticles.forEach((article) => store.add(article));

    expect(store.count).toBe(seedArticles.length);
  });

  it("should all be retrievable as anonymized articles", () => {
    const store = new ArticleStore();
    seedArticles.forEach((article) => store.add(article));

    const anonymized = store.getAllAnonymized();

    expect(anonymized).toHaveLength(seedArticles.length);
    anonymized.forEach((article) => {
      expect(article).not.toHaveProperty("sourceId");
      expect(article).not.toHaveProperty("url");
      expect(article.title).toBeTruthy();
      expect(article.body.length).toBeGreaterThanOrEqual(3);
    });
  });

  it("should support flagging passages from seed articles", () => {
    const flagStore = new FlagStore();
    const article = seedArticles[0];

    // Flag a passage from the first paragraph
    flagStore.add({
      id: "seed-flag-1",
      articleId: article.id,
      highlightedText: article.body[0].substring(0, 60),
      explanation: "Testing propaganda flagging with real article content",
      timestamp: Date.now(),
    });

    expect(flagStore.count).toBe(1);
    expect(flagStore.getByArticle(article.id)).toHaveLength(1);
  });

  it("should support flagging across multiple seed articles", () => {
    const flagStore = new FlagStore();

    seedArticles.slice(0, 4).forEach((article, i) => {
      flagStore.add({
        id: `multi-flag-${i}`,
        articleId: article.id,
        highlightedText: article.body[0].substring(0, 60),
        explanation: `Flagged passage from article ${i + 1}`,
        timestamp: Date.now() + i,
      });
    });

    expect(flagStore.count).toBe(4);
    seedArticles.slice(0, 4).forEach((article) => {
      expect(flagStore.getByArticle(article.id)).toHaveLength(1);
    });
  });

  it("should cover a range of topic tags", () => {
    const allTags = seedArticles.flatMap((a) => a.sourceTags);
    const uniqueTags = new Set(allTags);

    // Should cover a range of news topics
    expect(uniqueTags.size).toBeGreaterThanOrEqual(8);
  });
});
