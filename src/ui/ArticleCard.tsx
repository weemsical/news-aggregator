import { AnonymizedArticle } from "../types";
import "./ArticleCard.css";

interface ArticleCardProps {
  article: AnonymizedArticle;
  onSelect: (id: string) => void;
}

export function ArticleCard({ article, onSelect }: ArticleCardProps) {
  return (
    <article
      className="article-card"
      onClick={() => onSelect(article.id)}
      role="article"
    >
      <h2 className="article-card__title">{article.title}</h2>
      {article.subtitle && (
        <p className="article-card__subtitle">{article.subtitle}</p>
      )}
      <div className="article-card__tags">
        {article.sourceTags.map((tag) => (
          <span key={tag} className="article-card__tag">
            {tag}
          </span>
        ))}
      </div>
    </article>
  );
}
