import { AnonymizedArticle, PropagandaFlag } from "../types";

export interface AuthUser {
  id: string;
  email: string;
}

export async function fetchArticles(): Promise<AnonymizedArticle[]> {
  const response = await fetch("/api/articles", { credentials: "include" });
  if (!response.ok) throw new Error("Failed to fetch articles");
  return response.json();
}

export async function fetchFlags(articleId: string): Promise<PropagandaFlag[]> {
  const response = await fetch(`/api/articles/${articleId}/flags`, {
    credentials: "include",
  });
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
    credentials: "include",
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error("Failed to create flag");
  return response.json();
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
