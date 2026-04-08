import { Highlight } from "@types";

interface Span {
  start: number;
  end: number;
}

export function calculateOverlapPercentage(a: Span, b: Span): number {
  const overlapStart = Math.max(a.start, b.start);
  const overlapEnd = Math.min(a.end, b.end);
  const overlapLength = Math.max(0, overlapEnd - overlapStart);

  if (overlapLength === 0) return 0;

  const shorterLength = Math.min(a.end - a.start, b.end - b.start);
  if (shorterLength === 0) return 0;

  return overlapLength / shorterLength;
}

export function findOverlaps(
  highlights: Highlight[],
  paragraphIndex: number,
  startOffset: number,
  endOffset: number,
  threshold: number = 0.5
): Highlight[] {
  const querySpan: Span = { start: startOffset, end: endOffset };

  const matches = highlights
    .filter((h) => h.paragraphIndex === paragraphIndex && h.userId !== "anon")
    .map((h) => ({
      highlight: h,
      percentage: calculateOverlapPercentage(querySpan, {
        start: h.startOffset,
        end: h.endOffset,
      }),
    }))
    .filter((m) => m.percentage >= threshold)
    .sort((a, b) => b.percentage - a.percentage);

  return matches.map((m) => m.highlight);
}
