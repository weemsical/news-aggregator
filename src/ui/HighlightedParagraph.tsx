import { splitByOffsets } from "./highlightText";

interface HighlightRef {
  id: string;
  startOffset: number;
  endOffset: number;
  userId?: string;
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
      {segments.map((seg, i) => {
        if (!seg.highlighted) {
          return <span key={i}>{seg.text}</span>;
        }
        const colorClass = seg.userId === "anon"
          ? "article-reader__highlight--anon"
          : "article-reader__highlight--registered";
        return (
          <mark key={i} className={`article-reader__highlight ${colorClass}`}>
            {seg.text}
          </mark>
        );
      })}
    </p>
  );
}
