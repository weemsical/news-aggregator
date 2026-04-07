export interface TextSegment {
  text: string;
  highlighted: boolean;
  highlightId?: string;
}

interface HighlightRef {
  startOffset: number;
  endOffset: number;
  id: string;
}

export function splitByOffsets(
  paragraphText: string,
  highlights: HighlightRef[]
): TextSegment[] {
  if (highlights.length === 0) {
    return [{ text: paragraphText, highlighted: false }];
  }

  const sorted = [...highlights].sort((a, b) => a.startOffset - b.startOffset);

  const segments: TextSegment[] = [];
  let cursor = 0;

  for (const highlight of sorted) {
    const start = Math.max(highlight.startOffset, cursor);
    const end = Math.min(highlight.endOffset, paragraphText.length);

    if (start >= end) continue;

    if (start > cursor) {
      segments.push({ text: paragraphText.slice(cursor, start), highlighted: false });
    }

    segments.push({
      text: paragraphText.slice(start, end),
      highlighted: true,
      highlightId: highlight.id,
    });

    cursor = end;
  }

  if (cursor < paragraphText.length) {
    segments.push({ text: paragraphText.slice(cursor), highlighted: false });
  }

  return segments;
}
