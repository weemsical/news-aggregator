import { Highlight } from "@types";
import { OverlapResult } from "./apiClient";
import "./OverlapCheckModal.css";

interface OverlapCheckModalProps {
  overlaps: OverlapResult[];
  position: { top: number; left: number };
  onAgree: (highlight: Highlight) => void;
  onCreateNew: () => void;
  onCancel: () => void;
}

export function OverlapCheckModal({
  overlaps,
  position,
  onAgree,
  onCreateNew,
  onCancel,
}: OverlapCheckModalProps) {
  return (
    <div
      className="overlap-modal"
      style={{ top: position.top, left: position.left }}
    >
      <h4 className="overlap-modal__title">Similar highlights found</h4>
      <p className="overlap-modal__subtitle">
        These existing highlights overlap with your selection. You can agree with one instead of creating a duplicate.
      </p>
      <div className="overlap-modal__list">
        {overlaps.map((o) => (
          <div key={o.highlight.id} className="overlap-modal__item">
            <div className="overlap-modal__item-text">
              <span className="overlap-modal__highlighted-text">
                "{o.highlight.highlightedText}"
              </span>
              {o.highlight.explanation && (
                <span className="overlap-modal__explanation">
                  {o.highlight.explanation}
                </span>
              )}
              <span className="overlap-modal__match">
                {Math.round(o.overlapPercentage)}% match
              </span>
            </div>
            <button
              className="overlap-modal__agree-btn"
              onClick={() => onAgree(o.highlight)}
            >
              Agree
            </button>
          </div>
        ))}
      </div>
      <div className="overlap-modal__actions">
        <button className="overlap-modal__cancel" onClick={onCancel}>Cancel</button>
        <button className="overlap-modal__create-new" onClick={onCreateNew}>
          None of these — create new
        </button>
      </div>
    </div>
  );
}
