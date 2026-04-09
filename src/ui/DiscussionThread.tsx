import { useState, useEffect } from "react";
import { Comment } from "@types";
import { fetchComments, createComment, CommentsResponse } from "./apiClient";
import { useAuth } from "./AuthContext";
import { CommentInput } from "./CommentInput";
import "./DiscussionThread.css";

interface DiscussionThreadProps {
  highlightId: string;
  hasVoted: boolean;
}

export function DiscussionThread({ highlightId, hasVoted }: DiscussionThreadProps) {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [warning, setWarning] = useState<string | null>(null);
  const [replyTo, setReplyTo] = useState<{ id: string; text: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchComments(highlightId)
      .then((res: CommentsResponse) => {
        setComments(res.comments);
        setWarning(res.warning);
      })
      .catch(() => {});
  }, [highlightId]);

  const handleSubmit = async (text: string, replyToId?: string) => {
    setError(null);
    try {
      const result = await createComment(highlightId, { text, replyToId });
      setComments((prev) => [...prev, result]);
      if (result.warning) setWarning(result.warning);
      setReplyTo(null);
    } catch (e: any) {
      setError(e.message);
    }
  };

  const findComment = (id: string) => comments.find((c) => c.id === id);

  return (
    <div className="discussion-thread">
      <h4 className="discussion-thread__title">
        Discussion ({comments.length})
      </h4>
      {warning && (
        <p className="discussion-thread__warning">{warning}</p>
      )}
      <div className="discussion-thread__list">
        {comments.length === 0 && (
          <p className="discussion-thread__empty">
            {hasVoted ? "No comments yet. Start the discussion." : "No comments yet."}
          </p>
        )}
        {comments.map((comment) => {
          const quotedComment = comment.replyToId ? findComment(comment.replyToId) : null;
          return (
            <div key={comment.id} className="discussion-thread__comment">
              {quotedComment && (
                <div className="discussion-thread__quoted">
                  <span className="discussion-thread__quoted-text">{quotedComment.text}</span>
                </div>
              )}
              <p className="discussion-thread__comment-text">{comment.text}</p>
              <div className="discussion-thread__comment-meta">
                <span className="discussion-thread__comment-date">
                  {new Date(comment.createdAt).toLocaleDateString()}
                </span>
                {user && hasVoted && (
                  <button
                    className="discussion-thread__reply-btn"
                    onClick={() => setReplyTo({ id: comment.id, text: comment.text })}
                  >
                    Reply
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
      {error && <p className="discussion-thread__error">{error}</p>}
      {user && hasVoted ? (
        <CommentInput
          onSubmit={handleSubmit}
          replyToId={replyTo?.id}
          replyToText={replyTo?.text}
          onCancelReply={() => setReplyTo(null)}
        />
      ) : user && !hasVoted ? (
        <p className="discussion-thread__vote-prompt">Vote on this highlight to join the discussion.</p>
      ) : null}
    </div>
  );
}
