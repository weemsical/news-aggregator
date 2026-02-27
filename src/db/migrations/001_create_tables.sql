CREATE TABLE IF NOT EXISTS articles (
  id            TEXT PRIMARY KEY,
  title         TEXT NOT NULL,
  subtitle      TEXT,
  body          JSONB NOT NULL,
  source_tags   JSONB NOT NULL,
  source_id     TEXT NOT NULL,
  url           TEXT NOT NULL,
  fetched_at    BIGINT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_articles_fetched_at ON articles (fetched_at DESC);
CREATE INDEX IF NOT EXISTS idx_articles_source_id ON articles (source_id);

CREATE TABLE IF NOT EXISTS propaganda_flags (
  id                TEXT PRIMARY KEY,
  article_id        TEXT NOT NULL REFERENCES articles(id),
  highlighted_text  TEXT NOT NULL,
  explanation       TEXT NOT NULL,
  timestamp         BIGINT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_flags_article_id ON propaganda_flags (article_id);
CREATE INDEX IF NOT EXISTS idx_flags_timestamp ON propaganda_flags (timestamp ASC);
