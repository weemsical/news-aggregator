import { AnonymizedArticle, Highlight, LeaderboardEntry } from "@types";

export interface AuthUser {
  id: string;
  email: string;
  isAdmin?: boolean;
}

export interface AdminFeedSource {
  sourceId: string;
  name: string;
  feedUrl: string;
  defaultTags: string[];
  isDynamic: boolean;
}

export interface FetchNowResult {
  articlesFound: number;
  newArticlesSaved: number;
}

export async function fetchArticles(): Promise<AnonymizedArticle[]> {
  const response = await fetch("/api/articles", { credentials: "include" });
  if (!response.ok) throw new Error("Failed to fetch articles");
  return response.json();
}

export async function fetchHighlights(articleId: string): Promise<Highlight[]> {
  const response = await fetch(`/api/articles/${articleId}/highlights`, {
    credentials: "include",
  });
  if (!response.ok) throw new Error("Failed to fetch highlights");
  return response.json();
}

export async function createHighlight(
  articleId: string,
  data: {
    paragraphIndex: number;
    startOffset: number;
    endOffset: number;
    highlightedText: string;
    explanation?: string;
  }
): Promise<Highlight> {
  const response = await fetch(`/api/articles/${articleId}/highlights`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error("Failed to create highlight");
  return response.json();
}

export async function updateHighlight(
  highlightId: string,
  data: { explanation: string }
): Promise<Highlight> {
  const response = await fetch(`/api/highlights/${highlightId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error("Failed to update highlight");
  return response.json();
}

export async function deleteHighlight(highlightId: string): Promise<void> {
  const response = await fetch(`/api/highlights/${highlightId}`, {
    method: "DELETE",
    credentials: "include",
  });
  if (!response.ok) throw new Error("Failed to delete highlight");
}

export async function signup(
  email: string,
  password: string
): Promise<AuthUser> {
  const response = await fetch("/api/auth/signup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ email, password }),
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error || "Signup failed");
  }
  return response.json();
}

export async function login(
  email: string,
  password: string
): Promise<AuthUser> {
  const response = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ email, password }),
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error || "Login failed");
  }
  return response.json();
}

export async function logout(): Promise<void> {
  const response = await fetch("/api/auth/logout", {
    method: "POST",
    credentials: "include",
  });
  if (!response.ok) throw new Error("Logout failed");
}

export async function fetchCurrentUser(): Promise<AuthUser | null> {
  const response = await fetch("/api/auth/me", { credentials: "include" });
  if (!response.ok) return null;
  return response.json();
}

export async function fetchLeaderboard(): Promise<LeaderboardEntry[]> {
  const response = await fetch("/api/leaderboard", { credentials: "include" });
  if (!response.ok) throw new Error("Failed to fetch leaderboard");
  return response.json();
}

export async function fetchAdminFeedSources(): Promise<AdminFeedSource[]> {
  const response = await fetch("/api/admin/feed-sources", {
    credentials: "include",
  });
  if (!response.ok) throw new Error("Failed to fetch feed sources");
  return response.json();
}

export async function addFeedSource(data: {
  sourceId: string;
  name: string;
  feedUrl: string;
  defaultTags: string[];
}): Promise<AdminFeedSource> {
  const response = await fetch("/api/admin/feed-sources", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error || "Failed to add feed source");
  }
  return response.json();
}

export async function deleteFeedSource(sourceId: string): Promise<void> {
  const response = await fetch(`/api/admin/feed-sources/${sourceId}`, {
    method: "DELETE",
    credentials: "include",
  });
  if (!response.ok) throw new Error("Failed to delete feed source");
}

export async function fetchNow(sourceId: string): Promise<FetchNowResult> {
  const response = await fetch(`/api/admin/feed-sources/${sourceId}/fetch`, {
    method: "POST",
    credentials: "include",
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error || "Failed to fetch articles");
  }
  return response.json();
}
