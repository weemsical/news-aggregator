import { anonymize } from "@services";
import { seedArticles } from "@data";
import { AnonymizedArticle } from "@types";
import { fetchArticles, ArticlesResponse } from "./apiClient";

export async function loadArticles(
  options?: { sort?: string; page?: number }
): Promise<ArticlesResponse> {
  try {
    const response = await fetchArticles(options);
    if (response.articles.length > 0 || (options?.page && options.page > 1)) {
      return response;
    }
  } catch {
    // API not available — fall through to seed data
  }

  const all = seedArticles
    .map(anonymize)
    .sort((a, b) => b.fetchedAt - a.fetchedAt);

  return {
    articles: all,
    total: all.length,
    page: 1,
    pageSize: 20,
  };
}
