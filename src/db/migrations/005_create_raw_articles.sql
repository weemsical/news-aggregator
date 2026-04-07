CREATE TABLE IF NOT EXISTS raw_articles (
  id         TEXT PRIMARY KEY,
  title      TEXT NOT NULL,
  body       JSONB NOT NULL,
  source_id  TEXT NOT NULL,
  url        TEXT NOT NULL,
  fetched_at BIGINT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_raw_articles_source_id ON raw_articles (source_id);
