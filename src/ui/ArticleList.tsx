import { AnonymizedArticle } from "@types";
import { ArticleCard } from "./ArticleCard";
import "./ArticleList.css";

interface ArticleListProps {
  articles: AnonymizedArticle[];
  onSelectArticle: (id: string) => void;
  sort?: string;
  onSortChange?: (sort: string) => void;
  page?: number;
  total?: number;
  pageSize?: number;
  onPageChange?: (page: number) => void;
}

export function ArticleList({
  articles,
  onSelectArticle,
  sort = "date",
  onSortChange,
  page = 1,
  total = 0,
  pageSize = 20,
  onPageChange,
}: ArticleListProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="article-list">
      {onSortChange && (
        <div className="article-list__controls">
          <label className="article-list__sort-label">
            Sort by:{" "}
            <select
              className="article-list__sort-select"
              value={sort}
              onChange={(e) => onSortChange(e.target.value)}
            >
              <option value="date">Newest First</option>
              <option value="propaganda">Most Propaganda</option>
            </select>
          </label>
        </div>
      )}

      {articles.length === 0 ? (
        <p className="article-list__empty">No articles available.</p>
      ) : (
        articles.map((article) => (
          <ArticleCard
            key={article.id}
            article={article}
            onSelect={onSelectArticle}
          />
        ))
      )}

      {onPageChange && total > pageSize && (
        <div className="article-list__pagination">
          <button
            className="article-list__page-btn"
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
          >
            Previous
          </button>
          <span className="article-list__page-info">
            Page {page} of {totalPages}
          </span>
          <button
            className="article-list__page-btn"
            disabled={page >= totalPages}
            onClick={() => onPageChange(page + 1)}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
