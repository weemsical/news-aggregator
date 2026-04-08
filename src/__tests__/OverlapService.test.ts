import { calculateOverlapPercentage, findOverlaps } from "@services";
import { Highlight } from "@types";

function makeHighlight(
  overrides: Partial<Highlight> & { startOffset: number; endOffset: number }
): Highlight {
  return {
    id: "h-1",
    articleId: "article-1",
    userId: "user-1",
    paragraphIndex: 0,
    highlightedText: "text",
    explanation: "reason",
    isEdited: false,
    originalExplanation: null,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    ...overrides,
  };
}

describe("calculateOverlapPercentage", () => {
  it("returns 0 for non-overlapping spans", () => {
    expect(
      calculateOverlapPercentage(
        { start: 0, end: 5 },
        { start: 10, end: 15 }
      )
    ).toBe(0);
  });

  it("returns 0 for adjacent spans (no shared characters)", () => {
    expect(
      calculateOverlapPercentage(
        { start: 0, end: 5 },
        { start: 5, end: 10 }
      )
    ).toBe(0);
  });

  it("returns 1 for identical spans", () => {
    expect(
      calculateOverlapPercentage(
        { start: 0, end: 10 },
        { start: 0, end: 10 }
      )
    ).toBe(1);
  });

  it("returns 1 when shorter span is fully contained in longer", () => {
    expect(
      calculateOverlapPercentage(
        { start: 0, end: 20 },
        { start: 5, end: 10 }
      )
    ).toBe(1);
  });

  it("measures against shorter span", () => {
    // Shorter span is 5 chars (10-15), overlap region is 2 chars (13-15)
    // 2/5 = 0.4
    expect(
      calculateOverlapPercentage(
        { start: 0, end: 15 },
        { start: 13, end: 18 }
      )
    ).toBeCloseTo(0.4);
  });

  it("handles partial overlap above 50%", () => {
    // Shorter span is 10 chars (10-20), overlap region is 7 chars (10-17)
    // 7/10 = 0.7
    expect(
      calculateOverlapPercentage(
        { start: 3, end: 17 },
        { start: 10, end: 20 }
      )
    ).toBeCloseTo(0.7);
  });

  it("handles one-char overlap", () => {
    // Spans share 1 char at position 5. Shorter span is 5 chars (5-10).
    // 1/5 = 0.2
    expect(
      calculateOverlapPercentage(
        { start: 0, end: 6 },
        { start: 5, end: 10 }
      )
    ).toBeCloseTo(0.2);
  });
});

describe("findOverlaps", () => {
  it("returns empty array when no highlights exist", () => {
    const result = findOverlaps([], 0, 0, 10);
    expect(result).toEqual([]);
  });

  it("returns highlights that overlap above threshold", () => {
    const highlights = [
      makeHighlight({ id: "h-1", startOffset: 0, endOffset: 10 }),
    ];
    // Query span 0-10 exactly matches h-1 → 100% overlap
    const result = findOverlaps(highlights, 0, 0, 10);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("h-1");
  });

  it("excludes highlights below threshold", () => {
    const highlights = [
      makeHighlight({ id: "h-1", startOffset: 0, endOffset: 10 }),
    ];
    // Query span 8-20: overlap is 2 chars, shorter span is 10, 2/10 = 0.2 < 0.5
    const result = findOverlaps(highlights, 0, 8, 20);
    expect(result).toHaveLength(0);
  });

  it("only considers highlights in the same paragraph", () => {
    const highlights = [
      makeHighlight({ id: "h-1", paragraphIndex: 0, startOffset: 0, endOffset: 10 }),
      makeHighlight({ id: "h-2", paragraphIndex: 1, startOffset: 0, endOffset: 10 }),
    ];
    const result = findOverlaps(highlights, 0, 0, 10);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("h-1");
  });

  it("ranks results by overlap percentage (highest first)", () => {
    const highlights = [
      makeHighlight({ id: "h-1", startOffset: 0, endOffset: 10 }),
      makeHighlight({ id: "h-2", startOffset: 2, endOffset: 10 }),
    ];
    // Query span 0-10: h-1 = 100%, h-2 = 100% (shorter span 8 fully contained)
    // Both are 100% so order is stable. Let's use a span that differentiates:
    // Query span 0-12: h-1 overlap = 10/10 = 100%, h-2 overlap = 8/8 = 100%
    // Need different overlaps. Let's query 3-10:
    // h-1: overlap 3-10 = 7 chars, shorter span = 7, 7/7 = 100%
    // h-2: overlap 3-10 = 7 chars, shorter span = 7, 7/7 = 100%
    // Let me use a more differentiated setup:
    const highlights2 = [
      makeHighlight({ id: "h-low", startOffset: 0, endOffset: 20 }),
      makeHighlight({ id: "h-high", startOffset: 5, endOffset: 15 }),
    ];
    // Query span 5-15 (10 chars):
    // h-low: overlap 5-15 = 10 chars, shorter span = 10, 10/10 = 100%
    // h-high: overlap 5-15 = 10 chars, shorter span = 10, 10/10 = 100%
    // Still same. Let me use offset differences:
    const highlights3 = [
      makeHighlight({ id: "h-low", startOffset: 0, endOffset: 10 }),  // 10 chars
      makeHighlight({ id: "h-high", startOffset: 4, endOffset: 10 }), // 6 chars
    ];
    // Query span 3-10 (7 chars):
    // h-low: overlap 3-10 = 7, shorter = 7, 7/7 = 100%
    // h-high: overlap 4-10 = 6, shorter = 6, 6/6 = 100%
    // Both still 100%. The ranking only differs when overlap percentages differ.
    const highlights4 = [
      makeHighlight({ id: "h-low", startOffset: 0, endOffset: 10 }),  // 10 chars
      makeHighlight({ id: "h-high", startOffset: 3, endOffset: 8 }),  // 5 chars
    ];
    // Query span 0-6 (6 chars):
    // h-low: overlap 0-6 = 6, shorter = 6, 6/6 = 100%
    // h-high: overlap 3-6 = 3, shorter = 5, 3/5 = 60%
    const result = findOverlaps(highlights4, 0, 0, 6);
    expect(result).toHaveLength(2);
    expect(result[0].id).toBe("h-low");
    expect(result[1].id).toBe("h-high");
  });

  it("excludes anonymous highlights", () => {
    const highlights = [
      makeHighlight({ id: "h-anon", userId: "anon", startOffset: 0, endOffset: 10 }),
    ];
    const result = findOverlaps(highlights, 0, 0, 10);
    expect(result).toHaveLength(0);
  });

  it("respects custom threshold", () => {
    const highlights = [
      makeHighlight({ id: "h-1", startOffset: 0, endOffset: 10 }),
    ];
    // Query span 6-20: overlap = 4, shorter = 10, 4/10 = 0.4
    // Default threshold 0.5 would exclude, but 0.3 should include
    const result = findOverlaps(highlights, 0, 6, 20, 0.3);
    expect(result).toHaveLength(1);
  });
});
