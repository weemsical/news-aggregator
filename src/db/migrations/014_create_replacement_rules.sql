CREATE TABLE IF NOT EXISTS replacement_rules (
  id                TEXT PRIMARY KEY,
  source_id         TEXT NOT NULL,
  pattern           TEXT NOT NULL,
  replacement_text  TEXT NOT NULL,
  is_regex          BOOLEAN NOT NULL DEFAULT false,
  created_at        BIGINT NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT,
  updated_at        BIGINT NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT
);

CREATE INDEX IF NOT EXISTS idx_replacement_rules_source_id ON replacement_rules(source_id);
