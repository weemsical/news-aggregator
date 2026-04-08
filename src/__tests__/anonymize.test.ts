import { Article, AnonymizedArticle } from "@types";
import { anonymize } from "@services";

describe("anonymize", () => {
  /**
   * anonymize() is a pure function that takes a full Article
   * and returns an AnonymizedArticle with sourceId and url stripped.
   * This is the single point where identifying information is removed
   * before an article is presented to the user.
   */

  const sampleArticle: Article = {
    id: "article-1",
    rawArticleId: "article-1",
    reviewStatus: "approved",
    propagandaScore: 0,
    title: "Senator Tells House Committee 'I Do Not Recall' Key Details",
    subtitle: "Politician testifies before oversight committee on Thursday",
    body: [
      "The former official accused the committee of leveraging testimony.",
      "The witness maintained having no personal encounters with the subject.",
    ],
    sourceTags: ["politics", "investigations"],
    sourceId: "fox-news",
    url: "https://foxnews.com/politics/senator-testimony",
    fetchedAt: 1740000000000,
  };

  it("should return an AnonymizedArticle without sourceId or url", () => {
    const result = anonymize(sampleArticle);

    expect(result).not.toHaveProperty("sourceId");
    expect(result).not.toHaveProperty("url");
  });

  it("should preserve all non-identifying fields", () => {
    const result = anonymize(sampleArticle);

    expect(result.id).toBe("article-1");
    expect(result.title).toBe(
      "Senator Tells House Committee 'I Do Not Recall' Key Details"
    );
    expect(result.subtitle).toBe(
      "Politician testifies before oversight committee on Thursday"
    );
    expect(result.body).toEqual([
      "The former official accused the committee of leveraging testimony.",
      "The witness maintained having no personal encounters with the subject.",
    ]);
    expect(result.sourceTags).toEqual(["politics", "investigations"]);
    expect(result.fetchedAt).toBe(1740000000000);
  });

  it("should not mutate the original article", () => {
    const original = { ...sampleArticle };
    anonymize(sampleArticle);

    expect(sampleArticle).toEqual(original);
  });

  it("should handle articles without a subtitle", () => {
    const noSubtitle: Article = {
      id: "article-2",
      rawArticleId: "article-2",
      reviewStatus: "approved",
      propagandaScore: 0,
      title: "Brief Update",
      body: ["A short article."],
      sourceTags: ["breaking"],
      sourceId: "reuters",
      url: "https://reuters.com/brief",
      fetchedAt: 1740100000000,
    };

    const result = anonymize(noSubtitle);

    expect(result.subtitle).toBeUndefined();
    expect(result).not.toHaveProperty("sourceId");
    expect(result).not.toHaveProperty("url");
  });

  it("should return a proper AnonymizedArticle type", () => {
    const result: AnonymizedArticle = anonymize(sampleArticle);

    expect(result).toBeDefined();
  });
});
