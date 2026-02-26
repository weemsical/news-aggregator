import { useState } from "react";
import "./FlagPopover.css";

interface FlagPopoverProps {
  selectedText: string;
  position: { top: number; left: number };
  onSubmit: (explanation: string) => void;
  onCancel: () => void;
}

export function FlagPopover({
  selectedText,
  position,
  onSubmit,
  onCancel,
}: FlagPopoverProps) {
  const [explanation, setExplanation] = useState("");

  const handleSubmit = () => {
    if (!explanation.trim()) return;
    onSubmit(explanation);
  };

  return (
    <div
      className="flag-popover"
      style={{ top: position.top, left: position.left }}
    >
      <p className="flag-popover__selected-text">{selectedText}</p>
      <textarea
        className="flag-popover__textarea"
        placeholder="Why is this propaganda?"
        value={explanation}
        onChange={(e) => setExplanation(e.target.value)}
      />
      <div className="flag-popover__actions">
        <button className="flag-popover__cancel" onClick={onCancel}>
          Cancel
        </button>
        <button className="flag-popover__submit" onClick={handleSubmit}>
          Submit
        </button>
      </div>
    </div>
  );
}
