import { Article } from "@types";

describe("Article", () => {
  it("should capture the full structure of a scraped news article", () => {
    const article: Article = {
      id: "article-1",
      rawArticleId: "article-1",
      title: "Senator Tells House Committee 'I Do Not Recall' Key Details",
      subtitle: "Politician testifies before oversight committee on Thursday",
      body: [
        "The former official accused the committee of leveraging testimony to redirect attention during the congressional investigation.",
        "In opening remarks, the witness stated that a genuine committee would focus on systemic reforms rather than personal appearances.",
        "The witness maintained having no personal encounters with the subject of the investigation.",
        "The committee chairman stated that neither party has faced accusations of wrongdoing, though the panel seeks to understand various aspects of the case.",
      ],
      sourceTags: ["politics", "house of representatives", "investigations"],
      sourceId: "fox-news",
      url: "https://example.com/politics/senator-tells-house-committee",
      fetchedAt: 1740000000000,
      reviewStatus: "approved",
      propagandaScore: 0,
    };

    expect(article.id).toBe("article-1");
    expect(article.title).toContain("Senator Tells House Committee");
    expect(article.subtitle).toBe(
      "Politician testifies before oversight committee on Thursday"
    );
    expect(article.body).toHaveLength(4);
    expect(article.body[0]).toContain("accused the committee");
    expect(article.sourceTags).toContain("politics");
    expect(article.sourceId).toBe("fox-news");
    expect(article.url).toContain("example.com");
    expect(article.fetchedAt).toBe(1740000000000);
    expect(article.rawArticleId).toBe("article-1");
    expect(article.reviewStatus).toBe("approved");
    expect(article.propagandaScore).toBe(0);
  });

  it("should require multiple paragraphs in body to represent a full article", () => {
    const article: Article = {
      id: "article-2",
      rawArticleId: "article-2",
      title: "Breaking: Major Policy Change Announced",
      subtitle: "Officials respond to new directive",
      body: [
        "The administration announced sweeping changes to existing policy today.",
        "Critics argue the changes lack sufficient oversight.",
        "Supporters say the reforms are long overdue.",
      ],
      sourceTags: ["policy", "government"],
      sourceId: "cnn",
      url: "https://example.com/policy/major-change",
      fetchedAt: 1740100000000,
      reviewStatus: "approved",
      propagandaScore: 0,
    };

    expect(article.body.length).toBeGreaterThanOrEqual(1);
    article.body.forEach((paragraph) => {
      expect(typeof paragraph).toBe("string");
      expect(paragraph.length).toBeGreaterThan(0);
    });
  });

  it("should support articles with no subtitle", () => {
    const article: Article = {
      id: "article-3",
      rawArticleId: "article-3",
      title: "Brief News Update",
      body: ["A short article with minimal content."],
      sourceTags: ["breaking"],
      sourceId: "reuters",
      url: "https://example.com/brief-update",
      fetchedAt: 1740200000000,
      reviewStatus: "approved",
      propagandaScore: 0,
    };

    expect(article.subtitle).toBeUndefined();
  });

  it("should support multiple tags reflecting article categories", () => {
    const article: Article = {
      id: "article-4",
      rawArticleId: "article-4",
      title: "Economic Impact of New Trade Agreement",
      body: ["Trade experts weigh in on the new agreement."],
      sourceTags: ["economy", "trade", "international", "politics"],
      sourceId: "bbc",
      url: "https://example.com/economy/trade-agreement",
      fetchedAt: 1740300000000,
      reviewStatus: "approved",
      propagandaScore: 0,
    };

    expect(article.sourceTags).toHaveLength(4);
    expect(article.sourceTags).toEqual(
      expect.arrayContaining(["economy", "trade", "international", "politics"])
    );
  });
});
