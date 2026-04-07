import { useState, useEffect, useRef, useMemo } from "react";
import { AnonymizedArticle, Highlight } from "../types";
import { fetchHighlights, createHighlight, updateHighlight, deleteHighlight } from "./apiClient";
import { useAuth } from "./AuthContext";
import { HighlightToggle, HighlightView } from "./HighlightToggle";
import { HighlightedParagraph } from "./HighlightedParagraph";
import { HighlightPopover } from "./HighlightPopover";
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
  paragraphIndex: number;
  startOffset: number;
  endOffset: number;
  mode: "create" | "edit";
  highlightId?: string;
  initialExplanation?: string;
}

export function ArticleReader({ article, onBack }: ArticleReaderProps) {
  const { user } = useAuth();
  const [popover, setPopover] = useState<PopoverState | null>(null);
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [highlightView, setHighlightView] = useState<HighlightView>("all");
  const bodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchHighlights(article.id)
      .then(setHighlights)
      .catch(() => setHighlights([]));
  }, [article.id]);

  const visibleHighlights = useMemo(() => {
    if (!user) return [];
    if (highlightView === "none") return [];
    if (highlightView === "mine") return highlights.filter((h) => h.userId === user.id);
    return highlights;
  }, [highlights, highlightView, user]);

  const highlightsForParagraph = (paragraphIndex: number) =>
    visibleHighlights
      .filter((h) => h.paragraphIndex === paragraphIndex)
      .map((h) => ({ id: h.id, startOffset: h.startOffset, endOffset: h.endOffset }));

  const handleMouseUp = () => {
    if (!user) return;
    const info = getSelectionInfo(bodyRef.current);
    if (!info || !bodyRef.current) {
      return;
    }

    const bodyRect = bodyRef.current.getBoundingClientRect();
    setPopover({
      text: info.text,
      top: info.rect.bottom - bodyRect.top + 4,
      left: info.rect.left - bodyRect.left,
      paragraphIndex: info.paragraphIndex,
      startOffset: info.startOffset,
      endOffset: info.endOffset,
      mode: "create",
    });
  };

  const handleSubmit = async (explanation: string) => {
    if (!popover) return;

    try {
      if (popover.mode === "edit" && popover.highlightId) {
        const updated = await updateHighlight(popover.highlightId, { explanation });
        setHighlights((prev) =>
          prev.map((h) => (h.id === popover.highlightId ? updated : h))
        );
      } else {
        const newHighlight = await createHighlight(article.id, {
          paragraphIndex: popover.paragraphIndex,
          startOffset: popover.startOffset,
          endOffset: popover.endOffset,
          highlightedText: popover.text,
          explanation,
        });
        setHighlights((prev) => [...prev, newHighlight]);
      }
    } catch {
      // Highlight operation failed — silently ignore
    }

    window.getSelection()?.removeAllRanges();
    setPopover(null);
  };

  const handleDelete = async () => {
    if (!popover?.highlightId) return;

    try {
      await deleteHighlight(popover.highlightId);
      setHighlights((prev) => prev.filter((h) => h.id !== popover.highlightId));
    } catch {
      // Delete failed — silently ignore
    }

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
        <HighlightToggle value={highlightView} onChange={setHighlightView} />
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
            paragraphIndex={index}
            highlights={highlightsForParagraph(index)}
          />
        ))}
        {popover && (
          <HighlightPopover
            selectedText={popover.text}
            position={{ top: popover.top, left: popover.left }}
            mode={popover.mode}
            initialExplanation={popover.initialExplanation}
            highlightId={popover.highlightId}
            onSubmit={handleSubmit}
            onDelete={popover.mode === "edit" ? handleDelete : undefined}
            onCancel={handleCancel}
          />
        )}
      </div>
    </article>
  );
}
