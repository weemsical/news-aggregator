import { ArticleStore } from "../services/ArticleStore";
import { seedArticles } from "../data/seedArticles";
import { AnonymizedArticle } from "../types";

export async function loadArticles(): Promise<AnonymizedArticle[]> {
  const store = new ArticleStore();

  try {
    const response = await fetch("/articles.json");
    if (response.ok) {
      const articles = await response.json();
      if (Array.isArray(articles)) {
        articles.forEach((article: any) => store.add(article));
      }
    }
  } catch {
    // Fetch failed — fall through to seed data
  }

  // Fall back to seed data if no fetched articles loaded
  if (store.count === 0) {
    seedArticles.forEach((article) => store.add(article));
  }

  return store.getAllAnonymized();
}
