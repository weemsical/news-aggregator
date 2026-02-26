export interface TextSegment {
  text: string;
  highlighted: boolean;
  flagId?: string;
}

interface FlagRef {
  highlightedText: string;
  id: string;
}

export function splitByHighlights(
  paragraph: string,
  flags: FlagRef[]
): TextSegment[] {
  if (flags.length === 0) {
    return [{ text: paragraph, highlighted: false }];
  }

  // Find all match positions, sorted by index in the paragraph
  const matches: Array<{ start: number; end: number; flagId: string }> = [];
  for (const flag of flags) {
    const idx = paragraph.indexOf(flag.highlightedText);
    if (idx !== -1) {
      matches.push({ start: idx, end: idx + flag.highlightedText.length, flagId: flag.id });
    }
  }

  if (matches.length === 0) {
    return [{ text: paragraph, highlighted: false }];
  }

  matches.sort((a, b) => a.start - b.start);

  const segments: TextSegment[] = [];
  let cursor = 0;

  for (const match of matches) {
    if (match.start > cursor) {
      segments.push({ text: paragraph.slice(cursor, match.start), highlighted: false });
    }
    segments.push({
      text: paragraph.slice(match.start, match.end),
      highlighted: true,
      flagId: match.flagId,
    });
    cursor = match.end;
  }

  if (cursor < paragraph.length) {
    segments.push({ text: paragraph.slice(cursor), highlighted: false });
  }

  return segments;
}
