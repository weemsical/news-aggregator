import { useState } from "react";
import "./CommentInput.css";

const MAX_COMMENT_LENGTH = 250;

interface CommentInputProps {
  onSubmit: (text: string, replyToId?: string) => void;
  replyToId?: string;
  replyToText?: string;
  onCancelReply?: () => void;
  disabled?: boolean;
}

export function CommentInput({ onSubmit, replyToId, replyToText, onCancelReply, disabled }: CommentInputProps) {
  const [text, setText] = useState("");

  const handleSubmit = () => {
    if (!text.trim() || disabled) return;
    onSubmit(text.trim(), replyToId);
    setText("");
  };

  const remaining = MAX_COMMENT_LENGTH - text.length;

  return (
    <div className="comment-input">
      {replyToId && replyToText && (
        <div className="comment-input__reply-preview">
          <span className="comment-input__reply-label">Replying to:</span>
          <span className="comment-input__reply-text">{replyToText}</span>
          <button className="comment-input__reply-cancel" onClick={onCancelReply}>x</button>
        </div>
      )}
      <div className="comment-input__row">
        <input
          type="text"
          className="comment-input__field"
          placeholder="Add a comment..."
          value={text}
          onChange={(e) => setText(e.target.value.slice(0, MAX_COMMENT_LENGTH))}
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          disabled={disabled}
          maxLength={MAX_COMMENT_LENGTH}
        />
        <button
          className="comment-input__submit"
          onClick={handleSubmit}
          disabled={disabled || !text.trim()}
        >
          Post
        </button>
      </div>
      <span className={`comment-input__counter${remaining < 20 ? " comment-input__counter--low" : ""}`}>
        {remaining}
      </span>
    </div>
  );
}
