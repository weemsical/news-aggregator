import { Highlight } from "@types";
import { VotingControls } from "./VotingControls";
import { DiscussionThread } from "./DiscussionThread";
import { useAuth } from "./AuthContext";
import { useState, useEffect } from "react";
import { fetchVotes } from "./apiClient";
import "./HighlightDropdown.css";

interface HighlightDropdownProps {
  highlights: Highlight[];
  position: { top: number; left: number };
  onClose: () => void;
  onEdit?: (highlight: Highlight) => void;
  onDelete?: (highlight: Highlight) => void;
}

export function HighlightDropdown({
  highlights,
  position,
  onClose,
  onEdit,
  onDelete,
}: HighlightDropdownProps) {
  const { user } = useAuth();
  const [expandedId, setExpandedId] = useState<string | null>(
    highlights.length === 1 ? highlights[0].id : null
  );
  const [votedMap, setVotedMap] = useState<Record<string, boolean>>({});

  useEffect(() => {
    highlights.forEach((h) => {
      if (h.userId !== "anon") {
        fetchVotes(h.id).then((v) => {
          setVotedMap((prev) => ({ ...prev, [h.id]: v.userVote !== null }));
        }).catch(() => {});
      }
    });
  }, [highlights]);

  return (
    <div
      className="highlight-dropdown"
      style={{ top: position.top, left: position.left }}
    >
      <div className="highlight-dropdown__header">
        <span className="highlight-dropdown__count">{highlights.length} highlight{highlights.length !== 1 ? "s" : ""}</span>
        <button className="highlight-dropdown__close" onClick={onClose}>x</button>
      </div>
      <div className="highlight-dropdown__list">
        {highlights.map((h) => {
          const isOwn = user?.id === h.userId;
          const isAnon = h.userId === "anon";
          const isExpanded = expandedId === h.id;

          return (
            <div key={h.id} className="highlight-dropdown__item">
              <div
                className="highlight-dropdown__item-header"
                onClick={() => setExpandedId(isExpanded ? null : h.id)}
              >
                <span className="highlight-dropdown__item-text">
                  "{h.highlightedText}"
                </span>
                {h.isEdited && (
                  <span className="highlight-dropdown__edited" title={`Original: ${h.originalExplanation}`}>
                    (edited)
                  </span>
                )}
              </div>
              {isExpanded && (
                <div className="highlight-dropdown__item-details">
                  {h.explanation && (
                    <p className="highlight-dropdown__explanation">{h.explanation}</p>
                  )}
                  {isOwn && (
                    <div className="highlight-dropdown__own-actions">
                      <button className="highlight-dropdown__edit-btn" onClick={() => onEdit?.(h)}>Edit</button>
                      <button className="highlight-dropdown__delete-btn" onClick={() => onDelete?.(h)}>Delete</button>
                    </div>
                  )}
                  {!isAnon && (
                    <>
                      <VotingControls
                        highlightId={h.id}
                        highlightUserId={h.userId}
                        onVoted={() => setVotedMap((prev) => ({ ...prev, [h.id]: true }))}
                      />
                      <DiscussionThread
                        highlightId={h.id}
                        hasVoted={!!votedMap[h.id]}
                      />
                    </>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
