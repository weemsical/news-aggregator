export interface ArticleRow {
  id: string;
  raw_article_id: string;
  title: string;
  subtitle: string | null;
  body: string[];
  source_tags: string[];
  source_id: string;
  url: string;
  fetched_at: string | number;
  review_status: "pending" | "approved" | "rejected";
  propaganda_score: string | number;
}

export interface HighlightRow {
  id: string;
  article_id: string;
  user_id: string;
  paragraph_index: number;
  start_offset: number;
  end_offset: number;
  highlighted_text: string;
  explanation: string;
  is_edited: boolean;
  original_explanation: string | null;
  created_at: string | number;
  updated_at: string | number;
}

export interface VoteRow {
  id: string;
  highlight_id: string;
  user_id: string;
  vote_type: "agree" | "disagree";
  reason: string | null;
  created_at: string | number;
  updated_at: string | number;
}

export interface CommentRow {
  id: string;
  highlight_id: string;
  user_id: string;
  text: string;
  reply_to_id: string | null;
  created_at: string | number;
}

export interface UserRow {
  id: string;
  email: string;
  password_hash: string;
  is_admin: boolean;
  created_at: string | number;
}

export interface RawArticleRow {
  id: string;
  title: string;
  body: string[];
  source_id: string;
  url: string;
  fetched_at: string | number;
}

export interface FeedSourceRow {
  source_id: string;
  name: string;
  feed_url: string;
  default_tags: string[];
  publish_mode: "auto" | "manual" | null;
}

export interface HighlightClusterRow {
  id: string;
  article_id: string;
  paragraph_index: number;
  highlight_ids: string[] | string;
  agreement_count: number;
  created_at: string | number;
  updated_at: string | number;
}

export interface ReplacementRuleRow {
  id: string;
  source_id: string;
  pattern: string;
  replacement_text: string;
  is_regex: boolean;
  created_at: string | number;
  updated_at: string | number;
}

export interface NotificationRow {
  id: string;
  user_id: string;
  type: string;
  reference_id: string | null;
  message: string;
  is_read: boolean;
  acknowledged_by: string[];
  created_at: string | number;
}
