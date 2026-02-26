import { AnonymizedArticle } from "../types";
import { ArticleCard } from "./ArticleCard";
import "./ArticleList.css";

interface ArticleListProps {
  articles: AnonymizedArticle[];
  onSelectArticle: (id: string) => void;
}

export function ArticleList({ articles, onSelectArticle }: ArticleListProps) {
  if (articles.length === 0) {
    return <p className="article-list__empty">No articles available.</p>;
  }

  return (
    <div className="article-list">
      {articles.map((article) => (
        <ArticleCard
          key={article.id}
          article={article}
          onSelect={onSelectArticle}
        />
      ))}
    </div>
  );
}
