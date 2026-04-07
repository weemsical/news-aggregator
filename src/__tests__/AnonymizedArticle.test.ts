import { Article, AnonymizedArticle } from "../types";

describe("AnonymizedArticle", () => {
  it("should exclude sourceId and url from the article", () => {
    const anonymized: AnonymizedArticle = {
      id: "article-1",
      rawArticleId: "article-1",
      title: "Senator Tells House Committee 'I Do Not Recall' Key Details",
      subtitle: "Politician testifies before oversight committee on Thursday",
      body: [
        "The former official accused the committee of leveraging testimony.",
        "The witness maintained having no personal encounters with the subject.",
      ],
      sourceTags: ["politics", "investigations"],
      fetchedAt: 1740000000000,
      reviewStatus: "approved",
      propagandaScore: 0,
    };

    expect(anonymized).not.toHaveProperty("sourceId");
    expect(anonymized).not.toHaveProperty("url");
    expect(anonymized.id).toBe("article-1");
    expect(anonymized.title).toContain("Senator Tells");
    expect(anonymized.body).toHaveLength(2);
  });

  it("should be creatable from an Article by stripping identifying fields", () => {
    const article: Article = {
      id: "article-2",
      rawArticleId: "article-2",
      title: "Major Policy Change Announced",
      subtitle: "Officials respond to new directive",
      body: ["The administration announced sweeping changes."],
      sourceTags: ["policy"],
      sourceId: "fox-news",
      url: "https://foxnews.com/politics/major-policy-change",
      fetchedAt: 1740100000000,
      reviewStatus: "approved",
      propagandaScore: 0,
    };

    const { sourceId, url, ...anonymized } = article;
    const result: AnonymizedArticle = anonymized;

    expect(result).not.toHaveProperty("sourceId");
    expect(result).not.toHaveProperty("url");
    expect(result.title).toBe("Major Policy Change Announced");
    expect(result.fetchedAt).toBe(1740100000000);
  });

  it("should preserve sourceTags since they describe content, not origin", () => {
    const article: Article = {
      id: "article-3",
      rawArticleId: "article-3",
      title: "Trade Agreement Analysis",
      body: ["Experts weigh in on the new agreement."],
      sourceTags: ["economy", "trade", "international"],
      sourceId: "bbc",
      url: "https://bbc.com/economy/trade",
      fetchedAt: 1740200000000,
      reviewStatus: "approved",
      propagandaScore: 0,
    };

    const { sourceId, url, ...anonymized } = article;
    const result: AnonymizedArticle = anonymized;

    expect(result.sourceTags).toEqual(["economy", "trade", "international"]);
  });
});
