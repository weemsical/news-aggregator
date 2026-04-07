CREATE TABLE IF NOT EXISTS highlights (
  id                   TEXT PRIMARY KEY,
  article_id           TEXT NOT NULL REFERENCES articles(id),
  user_id              TEXT NOT NULL,
  paragraph_index      INTEGER NOT NULL,
  start_offset         INTEGER NOT NULL,
  end_offset           INTEGER NOT NULL,
  highlighted_text     TEXT NOT NULL,
  explanation          TEXT NOT NULL,
  is_edited            BOOLEAN NOT NULL DEFAULT false,
  original_explanation TEXT,
  created_at           BIGINT NOT NULL,
  updated_at           BIGINT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_highlights_article_id ON highlights (article_id);
CREATE INDEX IF NOT EXISTS idx_highlights_user_id ON highlights (user_id);
CREATE INDEX IF NOT EXISTS idx_highlights_article_user ON highlights (article_id, user_id);
