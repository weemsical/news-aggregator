import { AnonymizedArticle, Highlight, SourceScore, Vote, Comment } from "@types";

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
  publishMode?: "auto" | "manual";
}

export interface FetchNowResult {
  articlesFound: number;
  newArticlesSaved: number;
}

export interface AdminUser {
  id: string;
  email: string;
  isAdmin: boolean;
}

export interface ArticlesResponse {
  articles: AnonymizedArticle[];
  total: number;
  page: number;
  pageSize: number;
}

export async function fetchArticles(
  options?: { sort?: string; page?: number }
): Promise<ArticlesResponse> {
  const params = new URLSearchParams();
  if (options?.sort) params.set("sort", options.sort);
  if (options?.page) params.set("page", String(options.page));
  const qs = params.toString();
  const url = qs ? `/api/articles?${qs}` : "/api/articles";
  const response = await fetch(url, { credentials: "include" });
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

export async function fetchScores(
  options?: { from?: string; to?: string }
): Promise<SourceScore[]> {
  const params = new URLSearchParams();
  if (options?.from) params.set("from", options.from);
  if (options?.to) params.set("to", options.to);
  const qs = params.toString();
  const url = qs ? `/api/scores?${qs}` : "/api/scores";
  const response = await fetch(url, { credentials: "include" });
  if (!response.ok) throw new Error("Failed to fetch scores");
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

export async function fetchAdmins(): Promise<AdminUser[]> {
  const response = await fetch("/api/admin/admins", {
    credentials: "include",
  });
  if (!response.ok) throw new Error("Failed to fetch admins");
  return response.json();
}

export async function addAdminByEmail(email: string): Promise<AdminUser> {
  const response = await fetch("/api/admin/admins", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ email }),
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error || "Failed to add admin");
  }
  return response.json();
}

export async function removeAdmin(userId: string): Promise<void> {
  const response = await fetch(`/api/admin/admins/${userId}`, {
    method: "DELETE",
    credentials: "include",
  });
  if (!response.ok) throw new Error("Failed to remove admin");
}

// Publish mode

export async function updateFeedSource(
  sourceId: string,
  data: { publishMode?: string }
): Promise<AdminFeedSource> {
  const response = await fetch(`/api/admin/feed-sources/${sourceId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error("Failed to update feed source");
  return response.json();
}

// Replacement rules

export interface ReplacementRuleData {
  id: string;
  sourceId: string;
  pattern: string;
  replacementText: string;
  isRegex: boolean;
  createdAt: number;
  updatedAt: number;
}

export async function fetchReplacementRules(sourceId: string): Promise<ReplacementRuleData[]> {
  const response = await fetch(`/api/admin/sources/${sourceId}/rules`, {
    credentials: "include",
  });
  if (!response.ok) throw new Error("Failed to fetch replacement rules");
  return response.json();
}

export async function createReplacementRule(
  sourceId: string,
  data: { pattern: string; replacementText: string; isRegex?: boolean }
): Promise<ReplacementRuleData> {
  const response = await fetch(`/api/admin/sources/${sourceId}/rules`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error || "Failed to create rule");
  }
  return response.json();
}

export async function updateReplacementRule(
  id: string,
  data: { pattern?: string; replacementText?: string; isRegex?: boolean }
): Promise<ReplacementRuleData> {
  const response = await fetch(`/api/admin/rules/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error("Failed to update rule");
  return response.json();
}

export async function deleteReplacementRule(id: string): Promise<void> {
  const response = await fetch(`/api/admin/rules/${id}`, {
    method: "DELETE",
    credentials: "include",
  });
  if (!response.ok) throw new Error("Failed to delete rule");
}

export async function previewReplacementRule(
  sourceId: string,
  data: { pattern: string; replacementText: string; isRegex?: boolean }
): Promise<{ matches: Array<{ articleId: string; original: string; replaced: string }> }> {
  const response = await fetch(`/api/admin/sources/${sourceId}/rules/preview`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error("Failed to preview rule");
  return response.json();
}

// Review queue

export interface ReviewArticle {
  id: string;
  rawArticleId: string;
  title: string;
  body: string[];
  sourceTags: string[];
  sourceId: string;
  url: string;
  fetchedAt: number;
  reviewStatus: string;
  propagandaScore: number;
}

export async function fetchReviewQueue(): Promise<ReviewArticle[]> {
  const response = await fetch("/api/admin/review-queue", {
    credentials: "include",
  });
  if (!response.ok) throw new Error("Failed to fetch review queue");
  return response.json();
}

export async function approveArticle(id: string): Promise<ReviewArticle> {
  const response = await fetch(`/api/admin/articles/${id}/approve`, {
    method: "POST",
    credentials: "include",
  });
  if (!response.ok) throw new Error("Failed to approve article");
  return response.json();
}

export async function rejectArticle(id: string): Promise<ReviewArticle> {
  const response = await fetch(`/api/admin/articles/${id}/reject`, {
    method: "POST",
    credentials: "include",
  });
  if (!response.ok) throw new Error("Failed to reject article");
  return response.json();
}

export async function reprocessArticle(
  id: string
): Promise<{ body: string[]; replacementMap: any[] }> {
  const response = await fetch(`/api/admin/articles/${id}/reprocess`, {
    method: "POST",
    credentials: "include",
  });
  if (!response.ok) throw new Error("Failed to reprocess article");
  return response.json();
}

// Notifications

export interface NotificationData {
  id: string;
  userId: string;
  type: string;
  referenceId: string | null;
  message: string;
  isRead: boolean;
  acknowledgedBy: string[];
  createdAt: number;
}

export async function fetchNotifications(): Promise<NotificationData[]> {
  const response = await fetch("/api/notifications", { credentials: "include" });
  if (!response.ok) throw new Error("Failed to fetch notifications");
  return response.json();
}

export async function fetchUnreadCount(): Promise<number> {
  const response = await fetch("/api/notifications/unread-count", { credentials: "include" });
  if (!response.ok) throw new Error("Failed to fetch unread count");
  const data = await response.json();
  return data.count;
}

export async function markNotificationRead(id: string): Promise<void> {
  const response = await fetch(`/api/notifications/${id}/read`, {
    method: "POST",
    credentials: "include",
  });
  if (!response.ok) throw new Error("Failed to mark notification read");
}

export async function acknowledgeNotification(id: string): Promise<void> {
  const response = await fetch(`/api/notifications/${id}/acknowledge`, {
    method: "POST",
    credentials: "include",
  });
  if (!response.ok) throw new Error("Failed to acknowledge notification");
}

// Votes

export interface VoteCounts {
  agrees: number;
  disagrees: number;
  userVote: "agree" | "disagree" | null;
}

export async function fetchVotes(highlightId: string): Promise<VoteCounts> {
  const response = await fetch(`/api/highlights/${highlightId}/votes`, {
    credentials: "include",
  });
  if (!response.ok) throw new Error("Failed to fetch votes");
  return response.json();
}

export async function castVote(
  highlightId: string,
  data: { voteType: "agree" | "disagree"; reason?: string }
): Promise<Vote> {
  const response = await fetch(`/api/highlights/${highlightId}/votes`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error || "Failed to cast vote");
  }
  return response.json();
}

// Comments

export interface CommentsResponse {
  comments: Comment[];
  total: number;
  warning: string | null;
}

export async function fetchComments(highlightId: string): Promise<CommentsResponse> {
  const response = await fetch(`/api/highlights/${highlightId}/comments`, {
    credentials: "include",
  });
  if (!response.ok) throw new Error("Failed to fetch comments");
  return response.json();
}

export async function createComment(
  highlightId: string,
  data: { text: string; replyToId?: string }
): Promise<Comment & { warning: string | null }> {
  const response = await fetch(`/api/highlights/${highlightId}/comments`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error || "Failed to create comment");
  }
  return response.json();
}

// Overlap check

export interface OverlapResult {
  highlight: Highlight;
  overlapPercentage: number;
}

export async function checkOverlap(
  articleId: string,
  params: { paragraphIndex: number; startOffset: number; endOffset: number }
): Promise<OverlapResult[]> {
  const qs = new URLSearchParams({
    paragraphIndex: String(params.paragraphIndex),
    startOffset: String(params.startOffset),
    endOffset: String(params.endOffset),
  }).toString();
  const response = await fetch(`/api/articles/${articleId}/highlights/check-overlap?${qs}`, {
    credentials: "include",
  });
  if (!response.ok) throw new Error("Failed to check overlaps");
  return response.json();
}

// Admin: fetch all feeds

export async function refreshAllFeeds(): Promise<FetchNowResult> {
  const response = await fetch("/api/admin/refresh-all", {
    method: "POST",
    credentials: "include",
  });
  if (!response.ok) throw new Error("Failed to refresh feeds");
  return response.json();
}
