CREATE TABLE comments (
  id TEXT PRIMARY KEY,
  highlight_id TEXT NOT NULL REFERENCES highlights(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  text VARCHAR(250) NOT NULL,
  reply_to_id TEXT REFERENCES comments(id) ON DELETE SET NULL,
  created_at BIGINT NOT NULL
);

CREATE INDEX idx_comments_highlight_id ON comments(highlight_id);
