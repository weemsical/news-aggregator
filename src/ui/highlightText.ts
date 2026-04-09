export interface TextSegment {
  text: string;
  highlighted: boolean;
  highlightId?: string;
  highlightIds?: string[];
  userId?: string;
}

interface HighlightRef {
  startOffset: number;
  endOffset: number;
  id: string;
  userId?: string;
}

export function splitByOffsets(
  paragraphText: string,
  highlights: HighlightRef[]
): TextSegment[] {
  if (highlights.length === 0) {
    return [{ text: paragraphText, highlighted: false }];
  }

  // Collect all boundary points
  const boundaries = new Set<number>();
  boundaries.add(0);
  boundaries.add(paragraphText.length);
  for (const h of highlights) {
    boundaries.add(Math.max(0, h.startOffset));
    boundaries.add(Math.min(paragraphText.length, h.endOffset));
  }

  const sortedBoundaries = [...boundaries].sort((a, b) => a - b);
  const segments: TextSegment[] = [];

  for (let i = 0; i < sortedBoundaries.length - 1; i++) {
    const start = sortedBoundaries[i];
    const end = sortedBoundaries[i + 1];
    if (start >= end) continue;

    const covering = highlights.filter(
      (h) => h.startOffset <= start && h.endOffset >= end
    );

    if (covering.length === 0) {
      segments.push({ text: paragraphText.slice(start, end), highlighted: false });
    } else {
      // Use first covering highlight's userId for color; track all IDs
      segments.push({
        text: paragraphText.slice(start, end),
        highlighted: true,
        highlightId: covering[0].id,
        highlightIds: covering.map((h) => h.id),
        userId: covering.some((h) => h.userId !== "anon") ? covering[0].userId : "anon",
      });
    }
  }

  return segments;
}
