-- Copy existing articles into raw_articles
INSERT INTO raw_articles (id, title, body, source_id, url, fetched_at)
SELECT id, title, body, source_id, url, fetched_at
FROM articles
ON CONFLICT (id) DO NOTHING;

-- Add new columns to articles
ALTER TABLE articles ADD COLUMN IF NOT EXISTS raw_article_id TEXT REFERENCES raw_articles(id);
ALTER TABLE articles ADD COLUMN IF NOT EXISTS review_status TEXT NOT NULL DEFAULT 'approved';
ALTER TABLE articles ADD COLUMN IF NOT EXISTS propaganda_score REAL NOT NULL DEFAULT 0;

-- Backfill raw_article_id for existing rows
UPDATE articles SET raw_article_id = id WHERE raw_article_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_articles_review_status ON articles (review_status);
