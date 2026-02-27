CREATE TABLE IF NOT EXISTS feed_sources (
  source_id     TEXT PRIMARY KEY,
  name          TEXT NOT NULL,
  feed_url      TEXT NOT NULL,
  default_tags  JSONB NOT NULL DEFAULT '[]'
);
