CREATE TABLE votes (
  id TEXT PRIMARY KEY,
  highlight_id TEXT NOT NULL REFERENCES highlights(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  vote_type VARCHAR(10) NOT NULL CHECK (vote_type IN ('agree', 'disagree')),
  reason TEXT,
  created_at BIGINT NOT NULL,
  updated_at BIGINT NOT NULL,
  UNIQUE (highlight_id, user_id)
);

CREATE INDEX idx_votes_highlight_id ON votes(highlight_id);
CREATE INDEX idx_votes_user_id ON votes(user_id);
