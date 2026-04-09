import { useState, useEffect, useRef, useMemo } from "react";
import { AnonymizedArticle, Highlight } from "@types";
import {
  fetchHighlights,
  createHighlight,
  updateHighlight,
  deleteHighlight,
  checkOverlap,
  castVote,
  OverlapResult,
} from "./apiClient";
import { useAuth } from "./AuthContext";
import { HighlightToggle, HighlightView } from "./HighlightToggle";
import { HighlightedParagraph } from "./HighlightedParagraph";
import { HighlightPopover } from "./HighlightPopover";
import { OverlapCheckModal } from "./OverlapCheckModal";
import { HighlightDropdown } from "./HighlightDropdown";
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

interface OverlapState {
  overlaps: OverlapResult[];
  position: { top: number; left: number };
  pendingHighlight: {
    paragraphIndex: number;
    startOffset: number;
    endOffset: number;
    text: string;
  };
}

interface DropdownState {
  highlightIds: string[];
  position: { top: number; left: number };
}

export function ArticleReader({ article, onBack }: ArticleReaderProps) {
  const { user } = useAuth();
  const [popover, setPopover] = useState<PopoverState | null>(null);
  const [overlapModal, setOverlapModal] = useState<OverlapState | null>(null);
  const [dropdown, setDropdown] = useState<DropdownState | null>(null);
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [highlightView, setHighlightView] = useState<HighlightView>(user ? "mine" : "none");
  const [error, setError] = useState<string | null>(null);
  const bodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchHighlights(article.id)
      .then(setHighlights)
      .catch(() => setHighlights([]));
  }, [article.id]);

  const visibleHighlights = useMemo(() => {
    if (highlightView === "none") return [];
    if (!user) return highlights;
    if (highlightView === "mine") return highlights.filter((h) => h.userId === user.id);
    return highlights;
  }, [highlights, highlightView, user]);

  const highlightsForParagraph = (paragraphIndex: number) =>
    visibleHighlights
      .filter((h) => h.paragraphIndex === paragraphIndex)
      .map((h) => ({ id: h.id, startOffset: h.startOffset, endOffset: h.endOffset, userId: h.userId }));

  const handleMouseUp = async () => {
    setError(null);
    const info = getSelectionInfo(bodyRef.current);
    if (!info || !bodyRef.current) {
      return;
    }

    const bodyRect = bodyRef.current.getBoundingClientRect();
    const position = {
      top: info.rect.bottom - bodyRect.top + 4,
      left: info.rect.left - bodyRect.left,
    };

    // For logged-in users, check overlaps first
    if (user) {
      try {
        const overlaps = await checkOverlap(article.id, {
          paragraphIndex: info.paragraphIndex,
          startOffset: info.startOffset,
          endOffset: info.endOffset,
        });

        if (overlaps.length > 0) {
          setOverlapModal({
            overlaps,
            position,
            pendingHighlight: {
              paragraphIndex: info.paragraphIndex,
              startOffset: info.startOffset,
              endOffset: info.endOffset,
              text: info.text,
            },
          });
          return;
        }
      } catch {
        // If overlap check fails, proceed with normal creation
      }
    }

    setPopover({
      text: info.text,
      top: position.top,
      left: position.left,
      paragraphIndex: info.paragraphIndex,
      startOffset: info.startOffset,
      endOffset: info.endOffset,
      mode: "create",
    });
  };

  const handleOverlapAgree = async (highlight: Highlight) => {
    try {
      await castVote(highlight.id, { voteType: "agree" });
      // Refresh highlights to get updated vote counts
      const updated = await fetchHighlights(article.id);
      setHighlights(updated);
    } catch (e: any) {
      setError(e.message);
    }
    setOverlapModal(null);
    window.getSelection()?.removeAllRanges();
  };

  const handleOverlapCreateNew = () => {
    if (!overlapModal) return;
    const { pendingHighlight, position } = overlapModal;
    setOverlapModal(null);
    setPopover({
      text: pendingHighlight.text,
      top: position.top,
      left: position.left,
      paragraphIndex: pendingHighlight.paragraphIndex,
      startOffset: pendingHighlight.startOffset,
      endOffset: pendingHighlight.endOffset,
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
        if (!user && highlightView === "none") {
          setHighlightView("all");
        }
      }
    } catch {
      setError("Failed to save highlight. Please try again.");
      window.getSelection()?.removeAllRanges();
      setPopover(null);
      return;
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
      setError("Failed to delete highlight. Please try again.");
    }

    setPopover(null);
  };

  const handleDropdownDelete = async (highlight: Highlight) => {
    try {
      await deleteHighlight(highlight.id);
      setHighlights((prev) => prev.filter((h) => h.id !== highlight.id));
      setDropdown(null);
    } catch {
      setError("Failed to delete highlight. Please try again.");
    }
  };

  const handleDropdownEdit = (highlight: Highlight) => {
    setDropdown(null);
    setPopover({
      text: highlight.highlightedText,
      top: dropdown!.position.top,
      left: dropdown!.position.left,
      paragraphIndex: highlight.paragraphIndex,
      startOffset: highlight.startOffset,
      endOffset: highlight.endOffset,
      mode: "edit",
      highlightId: highlight.id,
      initialExplanation: highlight.explanation,
    });
  };

  const handleHighlightClick = (highlightIds: string[], event: React.MouseEvent) => {
    if (!bodyRef.current) return;
    const bodyRect = bodyRef.current.getBoundingClientRect();
    setDropdown({
      highlightIds,
      position: {
        top: event.clientY - bodyRect.top + 4,
        left: event.clientX - bodyRect.left,
      },
    });
    setPopover(null);
    setOverlapModal(null);
  };

  const handleCancel = () => {
    window.getSelection()?.removeAllRanges();
    setPopover(null);
    setOverlapModal(null);
  };

  const dropdownHighlights = dropdown
    ? highlights.filter((h) => dropdown.highlightIds.includes(h.id))
    : [];

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
      {error && <p className="article-reader__error" role="alert">{error}</p>}
      <HighlightToggle value={highlightView} onChange={setHighlightView} isAnonymous={!user} />
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
            onHighlightClick={handleHighlightClick}
          />
        ))}
        {overlapModal && (
          <OverlapCheckModal
            overlaps={overlapModal.overlaps}
            position={overlapModal.position}
            onAgree={handleOverlapAgree}
            onCreateNew={handleOverlapCreateNew}
            onCancel={handleCancel}
          />
        )}
        {popover && !overlapModal && (
          <HighlightPopover
            selectedText={popover.text}
            position={{ top: popover.top, left: popover.left }}
            mode={popover.mode}
            isAnonymous={!user}
            initialExplanation={popover.initialExplanation}
            highlightId={popover.highlightId}
            onSubmit={handleSubmit}
            onDelete={popover.mode === "edit" ? handleDelete : undefined}
            onCancel={handleCancel}
          />
        )}
        {dropdown && dropdownHighlights.length > 0 && (
          <HighlightDropdown
            highlights={dropdownHighlights}
            position={dropdown.position}
            onClose={() => setDropdown(null)}
            onEdit={handleDropdownEdit}
            onDelete={handleDropdownDelete}
          />
        )}
      </div>
    </article>
  );
}
