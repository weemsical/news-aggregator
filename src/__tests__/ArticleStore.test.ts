import { Article } from "../types";
import { ArticleStore } from "../services/ArticleStore";

describe("ArticleStore", () => {
  /**
   * ArticleStore is an in-memory store for articles.
   * Internally it holds full Articles (with sourceId, url) for tracking.
   * Externally it only exposes AnonymizedArticles to prevent bias.
   */

  const foxArticle: Article = {
    id: "article-1",
    title: "Senator Tells House Committee Key Details",
    body: [
      "The former official accused the committee of leveraging testimony.",
      "The witness maintained having no personal encounters with the subject.",
    ],
    sourceTags: ["politics", "investigations"],
    sourceId: "fox-news",
    url: "https://foxnews.com/politics/senator-testimony",
    fetchedAt: 1740000000000,
  };

  const cnnArticle: Article = {
    id: "article-2",
    title: "Major Policy Change Announced",
    subtitle: "Officials respond to new directive",
    body: [
      "The administration announced sweeping changes today.",
      "Critics argue the changes lack oversight.",
    ],
    sourceTags: ["policy", "government"],
    sourceId: "cnn",
    url: "https://cnn.com/politics/major-policy-change",
    fetchedAt: 1740100000000,
  };

  let store: ArticleStore;

  beforeEach(() => {
    store = new ArticleStore();
  });

  it("should start empty", () => {
    expect(store.getAllAnonymized()).toEqual([]);
  });

  it("should add an article and retrieve it anonymized", () => {
    store.add(foxArticle);

    const result = store.getAnonymized("article-1");

    expect(result).toBeDefined();
    expect(result!.id).toBe("article-1");
    expect(result!.title).toBe("Senator Tells House Committee Key Details");
    expect(result).not.toHaveProperty("sourceId");
    expect(result).not.toHaveProperty("url");
  });

  it("should return undefined for a non-existent article", () => {
    expect(store.getAnonymized("does-not-exist")).toBeUndefined();
  });

  it("should store multiple articles", () => {
    store.add(foxArticle);
    store.add(cnnArticle);

    const all = store.getAllAnonymized();

    expect(all).toHaveLength(2);
    all.forEach((article) => {
      expect(article).not.toHaveProperty("sourceId");
      expect(article).not.toHaveProperty("url");
    });
  });

  it("should never expose sourceId or url through any public method", () => {
    store.add(foxArticle);
    store.add(cnnArticle);

    const single = store.getAnonymized("article-1");
    const all = store.getAllAnonymized();

    expect(single).not.toHaveProperty("sourceId");
    expect(single).not.toHaveProperty("url");
    all.forEach((a) => {
      expect(a).not.toHaveProperty("sourceId");
      expect(a).not.toHaveProperty("url");
    });
  });

  it("should return the count of stored articles", () => {
    expect(store.count).toBe(0);

    store.add(foxArticle);
    expect(store.count).toBe(1);

    store.add(cnnArticle);
    expect(store.count).toBe(2);
  });

  it("should not allow duplicate article ids", () => {
    store.add(foxArticle);
    store.add(foxArticle);

    expect(store.count).toBe(1);
  });
});
