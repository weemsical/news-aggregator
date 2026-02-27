import { useState, useEffect, useRef, useMemo } from "react";
import { AnonymizedArticle, PropagandaFlag } from "../types";
import { fetchFlags, createFlag } from "./apiClient";
import { useAuth } from "./AuthContext";
import { FlagToggle, FlagView } from "./FlagToggle";
import { HighlightedParagraph } from "./HighlightedParagraph";
import { FlagPopover } from "./FlagPopover";
import { getSelectionInfo } from "./getSelectionInfo";
import "./ArticleReader.css";

interface ArticleReaderProps {
  article: AnonymizedArticle;
  onBack: () => void;
}

interface PopoverState {
  text: string;
  top: number;
  left: number;
}

export function ArticleReader({ article, onBack }: ArticleReaderProps) {
  const { user } = useAuth();
  const [popover, setPopover] = useState<PopoverState | null>(null);
  const [flags, setFlags] = useState<PropagandaFlag[]>([]);
  const [flagView, setFlagView] = useState<FlagView>("all");
  const bodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchFlags(article.id)
      .then(setFlags)
      .catch(() => setFlags([]));
  }, [article.id]);

  const visibleFlags = useMemo(() => {
    if (!user) return [];
    if (flagView === "none") return [];
    if (flagView === "mine") return flags.filter((f) => f.userId === user.id);
    return flags;
  }, [flags, flagView, user]);

  const handleMouseUp = () => {
    if (!user) return;
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

  const handleSubmit = async (explanation: string) => {
    if (!popover) return;

    try {
      const newFlag = await createFlag(article.id, {
        highlightedText: popover.text,
        explanation,
      });
      setFlags((prev) => [...prev, newFlag]);
    } catch {
      // Flag creation failed — silently ignore
    }

    window.getSelection()?.removeAllRanges();
    setPopover(null);
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
      {user && (
        <FlagToggle value={flagView} onChange={setFlagView} />
      )}
      <div
        className="article-reader__body"
        ref={bodyRef}
        onMouseUp={handleMouseUp}
      >
        {article.body.map((paragraph, index) => (
          <HighlightedParagraph
            key={index}
            text={paragraph}
            flags={visibleFlags.map((f) => ({ highlightedText: f.highlightedText, id: f.id }))}
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
