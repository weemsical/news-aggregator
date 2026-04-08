import { useState } from "react";
import "./HighlightPopover.css";

interface HighlightPopoverProps {
  selectedText: string;
  position: { top: number; left: number };
  mode: "create" | "edit";
  isAnonymous?: boolean;
  initialExplanation?: string;
  highlightId?: string;
  onSubmit: (explanation: string) => void;
  onDelete?: () => void;
  onCancel: () => void;
}

export function HighlightPopover({
  selectedText,
  position,
  mode,
  isAnonymous = false,
  initialExplanation = "",
  onSubmit,
  onDelete,
  onCancel,
}: HighlightPopoverProps) {
  const [explanation, setExplanation] = useState(initialExplanation);

  const handleSubmit = () => {
    if (isAnonymous) {
      onSubmit("");
      return;
    }
    if (!explanation.trim()) return;
    onSubmit(explanation);
  };

  return (
    <div
      className="highlight-popover"
      style={{ top: position.top, left: position.left }}
    >
      <p className="highlight-popover__selected-text">{selectedText}</p>
      {!isAnonymous && (
        <textarea
          className="highlight-popover__textarea"
          placeholder="Why is this propaganda?"
          value={explanation}
          onChange={(e) => setExplanation(e.target.value)}
        />
      )}
      {isAnonymous && (
        <p className="highlight-popover__signup-prompt">
          Create an account for your highlights to count toward scores
        </p>
      )}
      <div className="highlight-popover__actions">
        <button className="highlight-popover__cancel" onClick={onCancel}>
          Cancel
        </button>
        {mode === "edit" && onDelete && (
          <button className="highlight-popover__delete" onClick={onDelete}>
            Delete
          </button>
        )}
        <button className="highlight-popover__submit" onClick={handleSubmit}>
          {isAnonymous ? "Mark as Propaganda" : mode === "edit" ? "Update" : "Submit"}
        </button>
      </div>
    </div>
  );
}
