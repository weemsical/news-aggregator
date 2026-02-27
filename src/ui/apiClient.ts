import { AnonymizedArticle, PropagandaFlag } from "../types";

export async function fetchArticles(): Promise<AnonymizedArticle[]> {
  const response = await fetch("/api/articles");
  if (!response.ok) throw new Error("Failed to fetch articles");
  return response.json();
}

export async function fetchFlags(articleId: string): Promise<PropagandaFlag[]> {
  const response = await fetch(`/api/articles/${articleId}/flags`);
  if (!response.ok) throw new Error("Failed to fetch flags");
  return response.json();
}

export async function createFlag(
  articleId: string,
  data: { highlightedText: string; explanation: string }
): Promise<PropagandaFlag> {
  const response = await fetch(`/api/articles/${articleId}/flags`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error("Failed to create flag");
  return response.json();
}
