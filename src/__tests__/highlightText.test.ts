import { splitByOffsets, TextSegment } from "../ui/highlightText";

describe("splitByOffsets", () => {
  it("returns a single unhighlighted segment when highlights array is empty", () => {
    const result = splitByOffsets("Some paragraph text.", []);

    expect(result).toEqual([
      { text: "Some paragraph text.", highlighted: false },
    ]);
  });

  it("splits into before, highlighted, and after for a single highlight", () => {
    const result = splitByOffsets(
      "The witness accused the committee of leveraging testimony.",
      [{ startOffset: 12, endOffset: 33, id: "h-1" }]
    );

    expect(result).toEqual([
      { text: "The witness ", highlighted: false },
      { text: "accused the committee", highlighted: true, highlightId: "h-1" },
      { text: " of leveraging testimony.", highlighted: false },
    ]);
  });

  it("handles a highlight at the very start", () => {
    const result = splitByOffsets(
      "Breaking news arrived today.",
      [{ startOffset: 0, endOffset: 13, id: "h-2" }]
    );

    expect(result).toEqual([
      { text: "Breaking news", highlighted: true, highlightId: "h-2" },
      { text: " arrived today.", highlighted: false },
    ]);
  });

  it("handles a highlight at the very end", () => {
    const result = splitByOffsets(
      "Critics say the plan is dangerous.",
      [{ startOffset: 21, endOffset: 34, id: "h-3" }]
    );

    expect(result).toEqual([
      { text: "Critics say the plan ", highlighted: false },
      { text: "is dangerous.", highlighted: true, highlightId: "h-3" },
    ]);
  });

  it("handles a highlight spanning the entire paragraph", () => {
    const result = splitByOffsets(
      "This is propaganda.",
      [{ startOffset: 0, endOffset: 19, id: "h-4" }]
    );

    expect(result).toEqual([
      { text: "This is propaganda.", highlighted: true, highlightId: "h-4" },
    ]);
  });

  it("handles multiple non-overlapping highlights", () => {
    const result = splitByOffsets(
      "The radical plan will destroy jobs and ruin the economy.",
      [
        { startOffset: 4, endOffset: 16, id: "h-5" },
        { startOffset: 39, endOffset: 55, id: "h-6" },
      ]
    );

    expect(result).toEqual([
      { text: "The ", highlighted: false },
      { text: "radical plan", highlighted: true, highlightId: "h-5" },
      { text: " will destroy jobs and ", highlighted: false },
      { text: "ruin the economy", highlighted: true, highlightId: "h-6" },
      { text: ".", highlighted: false },
    ]);
  });

  it("does not produce empty text segments", () => {
    const result = splitByOffsets(
      "Breaking news arrived today.",
      [{ startOffset: 0, endOffset: 13, id: "h-7" }]
    );

    result.forEach((segment) => {
      expect(segment.text.length).toBeGreaterThan(0);
    });
  });

  it("sorts highlights by startOffset before processing", () => {
    const result = splitByOffsets(
      "The radical plan will destroy.",
      [
        { startOffset: 22, endOffset: 29, id: "h-b" },
        { startOffset: 4, endOffset: 16, id: "h-a" },
      ]
    );

    expect(result[1].text).toBe("radical plan");
    expect(result[3].text).toBe("destroy");
  });
});
