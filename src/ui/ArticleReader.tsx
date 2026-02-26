import { useState, useRef } from "react";
import { AnonymizedArticle } from "../types";
import { FlagStore } from "../services/FlagStore";
import { HighlightedParagraph } from "./HighlightedParagraph";
import { FlagPopover } from "./FlagPopover";
import { getSelectionInfo } from "./getSelectionInfo";
import "./ArticleReader.css";

interface ArticleReaderProps {
  article: AnonymizedArticle;
  onBack: () => void;
  flagStore: FlagStore;
}

interface PopoverState {
  text: string;
  top: number;
  left: number;
}

let flagIdCounter = 0;

export function ArticleReader({ article, onBack, flagStore }: ArticleReaderProps) {
  const [popover, setPopover] = useState<PopoverState | null>(null);
  const [flagVersion, setFlagVersion] = useState(0);
  const bodyRef = useRef<HTMLDivElement>(null);

  const flags = flagStore.getByArticle(article.id);

  const handleMouseUp = () => {
    const info = getSelectionInfo();
    if (!info || !bodyRef.current) {
      return;
    }

    const bodyRect = bodyRef.current.getBoundingClientRect();
    setPopover({
      text: info.text,
      top: info.rect.bottom - bodyRect.top + 4,
      left: info.rect.left - bodyRect.left,
    });
  };

  const handleSubmit = (explanation: string) => {
    if (!popover) return;

    flagIdCounter++;
    flagStore.add({
      id: `flag-${Date.now()}-${flagIdCounter}`,
      articleId: article.id,
      highlightedText: popover.text,
      explanation,
      timestamp: Date.now(),
    });

    window.getSelection()?.removeAllRanges();
    setPopover(null);
    setFlagVersion((v) => v + 1);
  };

  const handleCancel = () => {
    window.getSelection()?.removeAllRanges();
    setPopover(null);
  };

  return (
    <article className="article-reader">
      <button className="article-reader__back" onClick={onBack}>
        Back to articles
      </button>
      <h1 className="article-reader__title">{article.title}</h1>
      {article.subtitle && (
        <p className="article-reader__subtitle">{article.subtitle}</p>
      )}
      <div className="article-reader__tags">
        {article.sourceTags.map((tag) => (
          <span key={tag} className="article-reader__tag">
            {tag}
          </span>
        ))}
      </div>
      <div
        className="article-reader__body"
        ref={bodyRef}
        onMouseUp={handleMouseUp}
        data-flag-version={flagVersion}
      >
        {article.body.map((paragraph, index) => (
          <HighlightedParagraph
            key={index}
            text={paragraph}
            flags={flags.map((f) => ({ highlightedText: f.highlightedText, id: f.id }))}
          />
        ))}
        {popover && (
          <FlagPopover
            selectedText={popover.text}
            position={{ top: popover.top, left: popover.left }}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
          />
        )}
      </div>
    </article>
  );
}
