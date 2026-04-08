import { Article, AnonymizedArticle } from "@types";

export function anonymize(article: Article): AnonymizedArticle {
  const { sourceId, url, ...anonymized } = article;
  return anonymized;
}
