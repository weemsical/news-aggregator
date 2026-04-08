CREATE TABLE highlight_clusters (
  id TEXT PRIMARY KEY,
  article_id TEXT NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  paragraph_index INTEGER NOT NULL,
  highlight_ids JSONB NOT NULL DEFAULT '[]',
  agreement_count INTEGER NOT NULL DEFAULT 0,
  created_at BIGINT NOT NULL,
  updated_at BIGINT NOT NULL
);

CREATE INDEX idx_highlight_clusters_article_id ON highlight_clusters(article_id);
CREATE INDEX idx_highlight_clusters_article_paragraph ON highlight_clusters(article_id, paragraph_index);
