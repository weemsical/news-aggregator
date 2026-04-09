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
  onHighlightClick?: (highlightIds: string[], event: React.MouseEvent) => void;
}

export function HighlightedParagraph({ text, paragraphIndex, highlights, onHighlightClick }: HighlightedParagraphProps) {
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
        const ids = seg.highlightIds || [];
        return (
          <mark
            key={i}
            className={`article-reader__highlight ${colorClass}`}
            onClick={(e) => {
              if (ids.length > 0 && onHighlightClick) {
                e.stopPropagation();
                onHighlightClick(ids, e);
              }
            }}
          >
            {seg.text}
            {ids.length > 1 && (
              <span className="article-reader__highlight-badge">{ids.length}</span>
            )}
          </mark>
        );
      })}
    </p>
  );
}
