import { splitByOffsets } from "./highlightText";

interface HighlightRef {
  id: string;
  startOffset: number;
  endOffset: number;
}

interface HighlightedParagraphProps {
  text: string;
  paragraphIndex: number;
  highlights: HighlightRef[];
}

export function HighlightedParagraph({ text, paragraphIndex, highlights }: HighlightedParagraphProps) {
  const segments = splitByOffsets(text, highlights);

  return (
    <p data-paragraph-index={paragraphIndex}>
      {segments.map((seg, i) =>
        seg.highlighted ? (
          <mark key={i} className="article-reader__highlight">
            {seg.text}
          </mark>
        ) : (
          <span key={i}>{seg.text}</span>
        )
      )}
    </p>
  );
}
