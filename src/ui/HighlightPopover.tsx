import { useState } from "react";
import "./HighlightPopover.css";

interface HighlightPopoverProps {
  selectedText: string;
  position: { top: number; left: number };
  mode: "create" | "edit";
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
  initialExplanation = "",
  onSubmit,
  onDelete,
  onCancel,
}: HighlightPopoverProps) {
  const [explanation, setExplanation] = useState(initialExplanation);

  const handleSubmit = () => {
    if (!explanation.trim()) return;
    onSubmit(explanation);
  };

  return (
    <div
      className="highlight-popover"
      style={{ top: position.top, left: position.left }}
    >
      <p className="highlight-popover__selected-text">{selectedText}</p>
      <textarea
        className="highlight-popover__textarea"
        placeholder="Why is this propaganda?"
        value={explanation}
        onChange={(e) => setExplanation(e.target.value)}
      />
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
          {mode === "edit" ? "Update" : "Submit"}
        </button>
      </div>
    </div>
  );
}
