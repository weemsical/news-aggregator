import { splitByHighlights, TextSegment } from "../ui/highlightText";

describe("splitByHighlights", () => {
  /**
   * splitByHighlights is a pure function that takes a paragraph string
   * and an array of flags, then splits the text into segments marking
   * which parts are highlighted as propaganda. This drives the rendering
   * of <mark> tags in the article reader.
   */

  it("should return a single unhighlighted segment when flags array is empty", () => {
    const result = splitByHighlights("Some paragraph text.", []);

    expect(result).toEqual([
      { text: "Some paragraph text.", highlighted: false },
    ]);
  });

  it("should return a single unhighlighted segment when no flag text matches", () => {
    const result = splitByHighlights("Some paragraph text.", [
      { highlightedText: "not in this paragraph", id: "flag-1" },
    ]);

    expect(result).toEqual([
      { text: "Some paragraph text.", highlighted: false },
    ]);
  });

  it("should split into before, highlighted, and after for a single match", () => {
    const result = splitByHighlights(
      "The witness accused the committee of leveraging testimony.",
      [{ highlightedText: "accused the committee", id: "flag-1" }]
    );

    expect(result).toEqual([
      { text: "The witness ", highlighted: false },
      { text: "accused the committee", highlighted: true, flagId: "flag-1" },
      { text: " of leveraging testimony.", highlighted: false },
    ]);
  });

  it("should handle a highlight at the very start of a paragraph", () => {
    const result = splitByHighlights(
      "Breaking news arrived today.",
      [{ highlightedText: "Breaking news", id: "flag-2" }]
    );

    expect(result).toEqual([
      { text: "Breaking news", highlighted: true, flagId: "flag-2" },
      { text: " arrived today.", highlighted: false },
    ]);
  });

  it("should handle a highlight at the very end of a paragraph", () => {
    const result = splitByHighlights(
      "Critics say the plan is dangerous.",
      [{ highlightedText: "is dangerous.", id: "flag-3" }]
    );

    expect(result).toEqual([
      { text: "Critics say the plan ", highlighted: false },
      { text: "is dangerous.", highlighted: true, flagId: "flag-3" },
    ]);
  });

  it("should handle a highlight that spans the entire paragraph", () => {
    const result = splitByHighlights(
      "This is propaganda.",
      [{ highlightedText: "This is propaganda.", id: "flag-4" }]
    );

    expect(result).toEqual([
      { text: "This is propaganda.", highlighted: true, flagId: "flag-4" },
    ]);
  });

  it("should handle multiple non-overlapping highlights", () => {
    const result = splitByHighlights(
      "The radical plan will destroy jobs and ruin the economy.",
      [
        { highlightedText: "radical plan", id: "flag-5" },
        { highlightedText: "ruin the economy", id: "flag-6" },
      ]
    );

    expect(result).toEqual([
      { text: "The ", highlighted: false },
      { text: "radical plan", highlighted: true, flagId: "flag-5" },
      { text: " will destroy jobs and ", highlighted: false },
      { text: "ruin the economy", highlighted: true, flagId: "flag-6" },
      { text: ".", highlighted: false },
    ]);
  });

  it("should not produce empty text segments", () => {
    const result = splitByHighlights(
      "Breaking news arrived today.",
      [{ highlightedText: "Breaking news", id: "flag-7" }]
    );

    result.forEach((segment) => {
      expect(segment.text.length).toBeGreaterThan(0);
    });
  });
});
