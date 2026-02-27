import { LeaderboardEntry } from "../types";
import "./SourceLeaderboard.css";

interface SourceLeaderboardProps {
  entries: LeaderboardEntry[];
}

export function SourceLeaderboard({ entries }: SourceLeaderboardProps) {
  if (entries.length === 0) {
    return (
      <div className="source-leaderboard">
        <h2 className="source-leaderboard__title">Source Leaderboard</h2>
        <p className="source-leaderboard__empty">No flags yet. Start reading and flagging articles to see which sources get called out most.</p>
      </div>
    );
  }

  const maxCount = entries[0].flagCount;

  return (
    <div className="source-leaderboard">
      <h2 className="source-leaderboard__title">Source Leaderboard</h2>
      <p className="source-leaderboard__description">
        Which news sources get the most propaganda flags?
      </p>
      <ol className="source-leaderboard__list">
        {entries.map((entry, index) => (
          <li key={entry.sourceId} className="source-leaderboard__entry">
            <span className="source-leaderboard__rank">{index + 1}</span>
            <div className="source-leaderboard__details">
              <div className="source-leaderboard__row">
                <span className="source-leaderboard__name">{entry.sourceName}</span>
                <span className="source-leaderboard__count">
                  {entry.flagCount} {entry.flagCount === 1 ? "flag" : "flags"}
                </span>
              </div>
              <div className="source-leaderboard__bar-track">
                <div
                  className="source-leaderboard__bar"
                  style={{ width: `${(entry.flagCount / maxCount) * 100}%` }}
                />
              </div>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
