import { Article, PropagandaFlag } from "../types";

describe("PropagandaFlag", () => {
  /**
   * A PropagandaFlag represents a user's identification of propaganda within an article.
   * The user highlights a passage of text, flags it, and writes a short explanation
   * of why they believe it is propaganda. Each flag is tied to a specific article
   * and timestamped so we can track when it was identified.
   */

  const sampleArticle: Article = {
    id: "article-1",
    title: "Senator Tells House Committee 'I Do Not Recall' Key Details",
    subtitle: "Politician testifies before oversight committee on Thursday",
    body: [
      "The former official accused the committee of leveraging testimony to redirect attention during the congressional investigation.",
      "In opening remarks, the witness stated that a genuine committee would focus on systemic reforms rather than personal appearances.",
      "The witness maintained having no personal encounters with the subject of the investigation.",
    ],
    sourceTags: ["politics", "investigations"],
    sourceId: "fox-news",
    url: "https://example.com/politics/senator-hearing",
    fetchedAt: 1740000000000,
  };

  it("should capture a highlighted passage and the user's explanation", () => {
    const flag: PropagandaFlag = {
      id: "flag-1",
      articleId: sampleArticle.id,
      highlightedText:
        "accused the committee of leveraging testimony to redirect attention",
      explanation:
        "Framing the testimony as a political attack rather than reporting what was said neutrally",
      timestamp: 1740000060000,
    };

    expect(flag.id).toBe("flag-1");
    expect(flag.articleId).toBe("article-1");
    expect(flag.highlightedText).toContain("leveraging testimony");
    expect(flag.explanation).toContain("Framing the testimony");
    expect(flag.timestamp).toBeGreaterThan(0);
  });

  it("should link to the article it was flagged in", () => {
    const flag: PropagandaFlag = {
      id: "flag-2",
      articleId: sampleArticle.id,
      highlightedText:
        "a genuine committee would focus on systemic reforms rather than personal appearances",
      explanation:
        "Implies the committee is not genuine without providing evidence",
      timestamp: 1740000120000,
    };

    expect(flag.articleId).toBe(sampleArticle.id);
  });

  it("should support multiple flags on the same article", () => {
    const flags: PropagandaFlag[] = [
      {
        id: "flag-3",
        articleId: sampleArticle.id,
        highlightedText: "accused the committee of leveraging testimony",
        explanation: "Loaded language — 'leveraging' implies manipulation",
        timestamp: 1740000060000,
      },
      {
        id: "flag-4",
        articleId: sampleArticle.id,
        highlightedText:
          "maintained having no personal encounters with the subject",
        explanation:
          "Presents denial without context about why this claim matters",
        timestamp: 1740000090000,
      },
    ];

    expect(flags).toHaveLength(2);
    flags.forEach((flag) => {
      expect(flag.articleId).toBe(sampleArticle.id);
    });
    expect(flags[0].id).not.toBe(flags[1].id);
    expect(flags[0].timestamp).toBeLessThan(flags[1].timestamp);
  });

  it("should require a non-empty explanation", () => {
    const flag: PropagandaFlag = {
      id: "flag-5",
      articleId: sampleArticle.id,
      highlightedText: "some highlighted text",
      explanation: "User must explain why this is propaganda",
      timestamp: Date.now(),
    };

    expect(flag.explanation.length).toBeGreaterThan(0);
    expect(flag.highlightedText.length).toBeGreaterThan(0);
  });
});
