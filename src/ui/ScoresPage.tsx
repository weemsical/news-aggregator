import { useState, useEffect } from "react";
import { SourceScore } from "@types";
import { fetchScores } from "./apiClient";
import { useAuth } from "./AuthContext";
import "./ScoresPage.css";

export function ScoresPage() {
  const { user } = useAuth();
  const [scores, setScores] = useState<SourceScore[]>([]);
  const [loading, setLoading] = useState(true);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const options: { from?: string; to?: string } = {};
    if (fromDate) options.from = fromDate;
    if (toDate) options.to = toDate;
    fetchScores(options)
      .then(setScores)
      .catch(() => setScores([]))
      .finally(() => setLoading(false));
  }, [user, fromDate, toDate]);

  if (!user) {
    return (
      <div className="scores-page">
        <h2 className="scores-page__title">Source Scores</h2>
        <p className="scores-page__login-prompt">
          Log in to see source propaganda scores.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="scores-page">
        <h2 className="scores-page__title">Source Scores</h2>
        <p className="scores-page__loading">Loading scores...</p>
      </div>
    );
  }

  const maxScore = scores.length > 0 ? scores[0].totalScore : 0;

  return (
    <div className="scores-page">
      <h2 className="scores-page__title">Source Scores</h2>
      <p className="scores-page__description">
        Which news sources have the most propaganda? Ranked by aggregate score.
      </p>

      <div className="scores-page__filters">
        <label className="scores-page__filter-label">
          From
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="scores-page__filter-input"
          />
        </label>
        <label className="scores-page__filter-label">
          To
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="scores-page__filter-input"
          />
        </label>
        {(fromDate || toDate) && (
          <button
            className="scores-page__filter-reset"
            onClick={() => { setFromDate(""); setToDate(""); }}
          >
            Reset
          </button>
        )}
      </div>

      {scores.length === 0 ? (
        <p className="scores-page__empty">
          No scores yet. Start highlighting and voting on articles to see source rankings.
        </p>
      ) : (
        <ol className="scores-page__list">
          {scores.map((entry, index) => (
            <li key={entry.sourceId} className="scores-page__entry">
              <span className="scores-page__rank">{index + 1}</span>
              <div className="scores-page__details">
                <div className="scores-page__row">
                  <span className="scores-page__name">{entry.sourceName}</span>
                  <span className="scores-page__score">
                    {entry.totalScore.toFixed(1)} total
                  </span>
                </div>
                <div className="scores-page__meta">
                  {entry.averageScore.toFixed(1)} avg / {entry.articleCount}{" "}
                  {entry.articleCount === 1 ? "article" : "articles"}
                </div>
                <div className="scores-page__bar-track">
                  <div
                    className="scores-page__bar"
                    style={{
                      width: maxScore > 0
                        ? `${(entry.totalScore / maxScore) * 100}%`
                        : "0%",
                    }}
                  />
                </div>
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
