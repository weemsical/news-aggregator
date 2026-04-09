import { useState, useEffect } from "react";
import { fetchVotes, castVote, VoteCounts } from "./apiClient";
import { useAuth } from "./AuthContext";
import "./VotingControls.css";

interface VotingControlsProps {
  highlightId: string;
  highlightUserId: string;
  onVoted?: () => void;
}

export function VotingControls({ highlightId, highlightUserId, onVoted }: VotingControlsProps) {
  const { user } = useAuth();
  const [counts, setCounts] = useState<VoteCounts>({ agrees: 0, disagrees: 0, userVote: null });
  const [showReasonInput, setShowReasonInput] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchVotes(highlightId)
      .then(setCounts)
      .catch(() => {});
  }, [highlightId]);

  const isOwnHighlight = user?.id === highlightUserId;

  const handleVote = async (voteType: "agree" | "disagree") => {
    if (!user || isOwnHighlight) return;
    setError(null);

    if (voteType === "disagree" && !showReasonInput) {
      setShowReasonInput(true);
      return;
    }

    if (voteType === "disagree" && !reason.trim()) {
      setError("A reason is required when disagreeing");
      return;
    }

    setLoading(true);
    try {
      await castVote(highlightId, {
        voteType,
        reason: voteType === "disagree" ? reason : undefined,
      });
      const updated = await fetchVotes(highlightId);
      setCounts(updated);
      setShowReasonInput(false);
      setReason("");
      onVoted?.();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="voting-controls">
        <span className="voting-controls__count">
          {counts.agrees} agree / {counts.disagrees} disagree
        </span>
      </div>
    );
  }

  return (
    <div className="voting-controls">
      <div className="voting-controls__buttons">
        <button
          className={`voting-controls__btn voting-controls__btn--agree${counts.userVote === "agree" ? " voting-controls__btn--active" : ""}`}
          onClick={() => handleVote("agree")}
          disabled={loading || isOwnHighlight}
          title={isOwnHighlight ? "Cannot vote on your own highlight" : "Agree"}
        >
          Agree ({counts.agrees})
        </button>
        <button
          className={`voting-controls__btn voting-controls__btn--disagree${counts.userVote === "disagree" ? " voting-controls__btn--active" : ""}`}
          onClick={() => handleVote("disagree")}
          disabled={loading || isOwnHighlight}
          title={isOwnHighlight ? "Cannot vote on your own highlight" : "Disagree"}
        >
          Disagree ({counts.disagrees})
        </button>
      </div>
      {showReasonInput && (
        <div className="voting-controls__reason">
          <input
            type="text"
            className="voting-controls__reason-input"
            placeholder="Why do you disagree?"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleVote("disagree")}
          />
          <button
            className="voting-controls__reason-submit"
            onClick={() => handleVote("disagree")}
            disabled={loading}
          >
            Submit
          </button>
          <button
            className="voting-controls__reason-cancel"
            onClick={() => { setShowReasonInput(false); setReason(""); }}
          >
            Cancel
          </button>
        </div>
      )}
      {error && <p className="voting-controls__error">{error}</p>}
    </div>
  );
}
