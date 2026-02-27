import { anonymize } from "../services/anonymize";
import { seedArticles } from "../data/seedArticles";
import { AnonymizedArticle } from "../types";
import { fetchArticles } from "./apiClient";

export async function loadArticles(): Promise<AnonymizedArticle[]> {
  try {
    const articles = await fetchArticles();
    if (articles.length > 0) {
      return articles;
    }
  } catch {
    // API not available — fall through to seed data
  }

  return seedArticles.map(anonymize);
}
