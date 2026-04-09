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
      { text: "accused the committee", highlighted: true, highlightId: "h-1", highlightIds: ["h-1"], userId: undefined },
      { text: " of leveraging testimony.", highlighted: false },
    ]);
  });

  it("handles a highlight at the very start", () => {
    const result = splitByOffsets(
      "Breaking news arrived today.",
      [{ startOffset: 0, endOffset: 13, id: "h-2" }]
    );

    expect(result).toEqual([
      { text: "Breaking news", highlighted: true, highlightId: "h-2", highlightIds: ["h-2"], userId: undefined },
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
      { text: "is dangerous.", highlighted: true, highlightId: "h-3", highlightIds: ["h-3"], userId: undefined },
    ]);
  });

  it("handles a highlight spanning the entire paragraph", () => {
    const result = splitByOffsets(
      "This is propaganda.",
      [{ startOffset: 0, endOffset: 19, id: "h-4" }]
    );

    expect(result).toEqual([
      { text: "This is propaganda.", highlighted: true, highlightId: "h-4", highlightIds: ["h-4"], userId: undefined },
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
      { text: "radical plan", highlighted: true, highlightId: "h-5", highlightIds: ["h-5"], userId: undefined },
      { text: " will destroy jobs and ", highlighted: false },
      { text: "ruin the economy", highlighted: true, highlightId: "h-6", highlightIds: ["h-6"], userId: undefined },
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

  it("propagates userId to highlighted segments", () => {
    const result = splitByOffsets(
      "The witness accused the committee.",
      [{ startOffset: 12, endOffset: 33, id: "h-1", userId: "user-1" }]
    );

    expect(result[1].userId).toBe("user-1");
    expect(result[0].userId).toBeUndefined();
  });

  it("propagates anon userId to highlighted segments", () => {
    const result = splitByOffsets(
      "The witness accused the committee.",
      [{ startOffset: 12, endOffset: 33, id: "h-1", userId: "anon" }]
    );

    expect(result[1].userId).toBe("anon");
  });

  it("handles overlapping highlights by merging into segments with multiple IDs", () => {
    //  0         1         2         3
    //  0123456789012345678901234567890123456
    // "The radical plan is dangerous to all."
    // h-a: 4-16  "radical plan"
    // h-b: 12-29 "plan is dangerous"
    const result = splitByOffsets(
      "The radical plan is dangerous to all.",
      [
        { startOffset: 4, endOffset: 16, id: "h-a", userId: "user-1" },
        { startOffset: 12, endOffset: 29, id: "h-b", userId: "user-2" },
      ]
    );

    // "The " (0-4) = unhighlighted
    // "radical " (4-12) = h-a only
    // "plan" (12-16) = h-a + h-b overlap
    // " is dangerous" (16-29) = h-b only
    // "s to all." (29-37) = unhighlighted
    expect(result[0]).toEqual({ text: "The ", highlighted: false });
    expect(result[1].highlighted).toBe(true);
    expect(result[1].highlightIds).toEqual(["h-a"]);
    expect(result[2].highlighted).toBe(true);
    expect(result[2].highlightIds).toEqual(["h-a", "h-b"]);
    expect(result[3].highlighted).toBe(true);
    expect(result[3].highlightIds).toEqual(["h-b"]);
    expect(result[4]).toEqual({ text: " to all.", highlighted: false });
  });
});
