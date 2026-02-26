import { splitByHighlights } from "./highlightText";

interface FlagRef {
  highlightedText: string;
  id: string;
}

interface HighlightedParagraphProps {
  text: string;
  flags: FlagRef[];
}

export function HighlightedParagraph({ text, flags }: HighlightedParagraphProps) {
  const segments = splitByHighlights(text, flags);

  return (
    <p>
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
