# PRD: Granular Propaganda Highlighting & Scoring System

## Overview

Replace the current whole-article flag system with a granular text-highlighting experience where readers select specific passages they believe are propaganda, optionally explain why, and vote on others' highlights. Logged-in users see blue highlights with explanations and voting; anonymous users see yellow highlights and can mark text but with no impact on scoring — driving account sign-ups. A weighted scoring system aggregates propaganda findings into per-source credibility rankings, and an admin dashboard provides full control over feed management, per-source text replacement rules, article review, and publish workflows.

---

## Core Design Decisions

These decisions were resolved during planning and should not be revisited without good reason:

1. **Articles are immutable once published.** Highlight offsets rely on stable text. No re-ingestion or editing of published articles.
2. **Text selections snap to word boundaries.** Partial-word highlights are prevented automatically.
3. **Per-paragraph offsets.** Highlights are stored as paragraph_index + start_offset + end_offset, aligning with the `string[]` body structure.
4. **Anonymous highlights tracked at API layer only.** All saved as user_id="anon" — no session tracking in the database.
5. **Pre-creation overlap check.** Before creating a new highlight, the system shows existing overlapping highlights and lets the user agree instead of duplicating.
6. **Overlap measured against the shorter span.** If 50%+ of the shorter highlight's characters are within the overlap region, it's a match.
7. **Vote-before-comment.** Users must agree or disagree before participating in a highlight's discussion thread.
8. **Permanent votes.** Once cast, a vote can flip (agree↔disagree) but never be removed.
9. **Minimum 3 total votes** (agrees + disagrees) before a highlight contributes to an article's propaganda score.
10. **Raw articles in separate table.** `raw_articles` stores unmodified RSS content; `articles` stores the processed/anonymized version with a foreign key back to raw.
11. **No in-memory repository fallback.** PostgreSQL is required. In-memory repos removed.
12. **Per-source replacement rules.** Admins define text/regex patterns per source to strip identifying language. Rules applied longest-match-first.
13. **Parallel feed fetching** with independent retry chains per feed.
14. **Date-seeded daily shuffle** for same-date article ordering — stable within a day, reshuffled the next.
15. **Notification dropdown only** — no dedicated notifications page.
16. **Scores filtered by article publication date**, not highlight/vote date.

---

## User Stories & Acceptance Criteria

### 1. Text Highlighting — Logged-in Users

**As a** logged-in user, **I want to** select a span of text in an article and mark it as propaganda with an explanation, **so that** I can contribute meaningful analysis.

**Acceptance Criteria:**
- User can click-and-drag to select any text span within an article body
- Selections automatically snap to word boundaries
- Before showing the explanation form, the system checks for overlapping highlights (50%+ of shorter span) in the same paragraph
- If overlaps found: show existing highlights ranked by match percentage (highest first), each with an "Agree" button; user can agree with an existing highlight or choose "None of these — create new"
- If no overlaps or user chooses "create new": popover appears with a required explanation text field
- Highlight is saved with paragraph_index, start_offset, end_offset, highlighted_text, explanation
- Highlight is rendered in blue on subsequent visits
- User can edit their own highlight's explanation; edited explanations are tagged "edited" and show the original text on hover (original vs. current only — no full version history)
- User can delete their own highlights entirely
- Highlights persist across sessions (tied to user account)

### 2. Text Highlighting — Anonymous Users

**As an** anonymous (non-logged-in) visitor, **I want to** highlight text I think is propaganda, **so that** I can engage with the content (and be motivated to sign up for full features).

**Acceptance Criteria:**
- Anonymous users can select text and mark it as propaganda (no explanation field, one-click mark)
- Selections snap to word boundaries
- All anonymous highlights are saved under user_id = "anon"
- Anonymous highlights cannot be edited or deleted
- Anonymous highlights are rendered in yellow for all anonymous users
- Anonymous highlights have zero impact on scoring, agreement, or the leaderboard
- Rate limiting enforced at the API layer: max 20 highlights per session per article, 100 per day per IP
- A prompt encourages sign-up: "Create an account for your highlights to count toward scores"

### 3. Highlight Visibility Toggle

**As a** reader, **I want to** toggle other users' highlights on or off, **so that** I can read articles without bias before seeing what others flagged.

**Acceptance Criteria:**
- Toggle at the top of the article view: "Show highlights" on/off (default: off)
- When off, only the current user's own highlights are visible
- When on:
  - Logged-in users see: blue highlights (logged-in users) and yellow highlights (anonymous)
  - Anonymous users see: all highlights in yellow (no distinction)

### 4. Overlapping Highlight Display

**As a** logged-in user viewing highlights, **I want to** see how many people flagged the same passage, **so that** I can gauge consensus.

**Acceptance Criteria:**
- Overlapping highlights from logged-in users display in the same shade of blue with a counter badge (e.g., "3 users flagged this")
- Overlap is calculated against the shorter span — if 50%+ of the shorter highlight's characters fall within the overlap region, it's a match
- Where overlapping highlights don't agree entirely (partial overlap), slightly darker vertical separator lines mark the boundaries between distinct highlight spans
- Clicking/hovering a highlighted region opens a dropdown showing all associated explanations

### 5. Agreement, Disagreement & Discussion

**As a** logged-in user, **I want to** agree or disagree with another user's highlight and discuss it, **so that** collective judgment refines what counts as propaganda.

**Acceptance Criteria:**
- Each blue highlight shows agree/disagree buttons when expanded
- One vote per user per highlight; cannot vote on own highlights
- Votes are permanent — can flip (agree↔disagree) but never removed
- Disagreeing requires a mandatory text explanation
- After voting, the user can participate in a flat, chronological discussion thread on that highlight
- Users who haven't voted see the thread as read-only
- Each reply can optionally quote a specific previous comment (rendered as a collapsed block at the top of the reply)
- Comments are limited to 250 characters
- Threads are capped at 50 comments; a warning appears at 45
- When a vote flips, a small indicator appears in the thread (e.g., "changed vote to agree")
- Anonymous users cannot vote or comment

### 6. Overlap-Based Agreement

**As the** system, highlights from different logged-in users that overlap by 50% or more of the shorter span's characters should be treated as implicit agreement on the same passage.

**Acceptance Criteria:**
- Overlap is calculated synchronously on highlight creation
- When two logged-in users' highlights share >= 50% character overlap (measured against shorter span), they are clustered as agreeing on the same propaganda passage
- Overlap clusters contribute to the article's propaganda score
- The overlap threshold is configurable (default 50%) for future tuning
- Anonymous highlights are excluded from overlap calculations

### 7. Article Propaganda Score

**As the** system, each article receives a propaganda score based on weighted agreement among logged-in users.

**Acceptance Criteria:**
- A highlight must have at least 3 total votes (agrees + disagrees) before it contributes to the article's score
- Highlights below the vote threshold are visible but don't affect scoring
- Weighting formula per qualifying highlight cluster: unique_agreeing_users * (agrees / (agrees + disagrees))
- Article score = sum of all qualifying cluster scores
- Anonymous highlights and votes are excluded entirely
- Score recalculates immediately (synchronously) when highlights or votes change

### 8. Source Scores Page (Leaderboard)

**As a** logged-in user, **I want to** see which news sources have the most propaganda, **so that** I can judge source credibility.

**Acceptance Criteria:**
- Page shows a ranked list of source names from highest to lowest propaganda score
- Each entry displays: source name, average propaganda score per article, total accumulated score
- No individual articles are shown — only aggregate source-level data
- This is the **only place** in the app where source names are visible to users
- Page is accessible only to logged-in users (returns 401 for anonymous)
- Date range filter — filters by article publication date (not highlight/vote date)

### 9. Article Listing & Ordering

**As a** reader, **I want to** browse articles in a clear, unbiased order, **so that** I can find content to read and analyze.

**Acceptance Criteria:**
- Articles are listed by date, newest first
- Articles with the same calendar day are ordered using a date-seeded shuffle (stable within a day, reshuffled the next)
- Paginated display (20 articles per page, fixed)
- Option to sort by highest propaganda count as an alternative ordering
- All articles are anonymized — no source identification anywhere in the listing or reading view

### 10. Admin Dashboard — Feed Management

**As an** admin, **I want to** add, remove, and configure RSS feeds from a dashboard, **so that** I don't need developer access to manage sources.

**Acceptance Criteria:**
- Admin dashboard uses sidebar navigation: feed list on left, selecting a feed shows its config; "Review Queue" as a separate sidebar item
- CRUD operations for RSS feed sources: add URL, edit, remove
- Per-source toggle: auto-publish vs. manual review required
- Per-source text replacement rules (see story 14)
- Feed list shows: source name, URL, publish mode, last successful fetch, status

### 11. Per-Source Text Replacement Rules

**As an** admin, **I want to** define text patterns per source that should be replaced during anonymization, **so that** identifying language (e.g., "libtard," source-specific phrases) is stripped from articles.

**Acceptance Criteria:**
- Admin enters plain text or raw regex per source
- Plain text is auto-converted to regex (with word boundaries by default)
- Admin sees a preview: example matches from existing articles for that source, with the replacement applied in context
- Admin approves before the rule is saved
- Replacement text is required for each rule
- Rules are applied longest-match-first to prevent partial replacement of longer phrases
- Rules are per-source — each source has its own living set of rules
- Rules apply to new articles only; published articles are immutable
- Pending (not yet approved) articles are re-processed when rules change

### 12. Admin Article Review Queue

**As an** admin, **I want to** review anonymized articles before they go public, **so that** I can verify identifying information has been properly stripped.

**Acceptance Criteria:**
- Articles from sources set to "manual review" enter a pending queue
- Admin sees the article after replacement rules have been applied, with replaced sections highlighted so substitutions can be verified in context
- Admin cannot edit article text directly — instead adjusts replacement rules and re-previews
- Admin can approve (publish) or reject (delete) each article
- Articles from "auto-publish" sources bypass the queue entirely
- Review status is tracked: pending, approved, rejected

### 13. Raw & Processed Article Storage

**As the** system, raw article content is stored separately from processed/anonymized content.

**Acceptance Criteria:**
- `raw_articles` table stores the original RSS content exactly as fetched (title, body, source_id, url, fetched_at)
- `articles` table stores the processed version (after replacement rules and anonymization) with a foreign key to `raw_articles`
- `source_id` exists on both tables (denormalized for query performance on scores page)
- Admin review routes can access `raw_articles` for re-processing; reader-facing routes only access `articles`

### 14. Daily RSS Ingestion

**As the** system, RSS feeds should be fetched daily before 6 AM server local time.

**Acceptance Criteria:**
- All configured feeds are fetched in parallel, completing before 6:00 AM server local time (cron starts at 5:00 AM)
- Each feed retries independently — up to 3 times with exponential backoff
- After 3 failures, skip the source for the day and notify all admins
- Admin feed failure notification is resolved when any admin acknowledges it (or the feed succeeds on the next run)
- New articles stored as raw_articles first, then processed through replacement rules and anonymization
- Articles from "manual review" sources go to the review queue; "auto-publish" articles go live immediately
- RSS parsing remains the primary ingestion method (no web scraping)

### 15. User Notifications

**As a** logged-in user, **I want to** be notified when others interact with my highlights, **so that** I stay engaged.

**Acceptance Criteria:**
- Agreement notifications are batched (e.g., "5 new agreements on your highlight")
- Disagreements and replies are individual notifications (they contain unique text worth reading)
- New article notifications
- Admin-specific: feed failure notifications with acknowledgment (resolves for all admins)
- Notification bell icon in header with unread count badge
- Dropdown shows recent notifications with mark-as-read
- No dedicated notifications page — dropdown only
- All participants in a highlight's discussion thread receive notifications for new activity in that thread

---

## Technical Scope

### Affected Layers

| Layer | Changes |
|-------|---------|
| **Database/Schema** | New tables: `raw_articles`, `highlights` (replaces `flags`), `votes`, `comments`, `highlight_clusters`, `notifications`, `feed_config`, `replacement_rules`. Modify: `articles` (add raw_article_id FK, review_status, propaganda_score). Drop: `propaganda_flags` |
| **Repositories** | New: Highlight, Vote, Comment, HighlightCluster, Notification, FeedConfig, ReplacementRule, RawArticle repositories (Postgres only — no in-memory fallback). Remove: Flag repository, all InMemory* repositories |
| **Services** | New: HighlightService, VotingService, ScoringService, OverlapService, NotificationService, ReplacementService, ScheduledIngestion. Modify: AnonymizationService (add replacement rule pipeline), RSSFetchService |
| **API Routes** | New: highlights CRUD, votes, comments, scores, notifications, admin feed management, admin replacement rules, admin review queue. Remove: flag endpoints, old leaderboard |
| **Frontend** | New: TextHighlighter, HighlightPopover (with overlap check), VotingControls, DiscussionThread, ScoresPage, NotificationBell/Dropdown, AdminDashboard (sidebar nav with feeds, rules, review queue). Replace: FlagToggle, FlagPopover, SourceLeaderboard. Modify: ArticleReader, ArticleList, App nav |

### Key Dependencies

- **Text selection API**: Browser Selection API for highlight creation + word boundary snapping
- **Cron scheduling**: Node-cron or similar for daily feed ingestion
- **Rate limiting**: express-rate-limit for anonymous highlight spam prevention

### Data Model Changes

```
raw_articles
  id, title, body (JSONB), source_id, url, fetched_at

articles (modified)
  id, raw_article_id (FK → raw_articles), title, subtitle,
  body (JSONB — processed), source_tags, source_id,
  review_status (pending/approved/rejected), propaganda_score (REAL, default 0),
  fetched_at

highlights
  id, article_id, user_id, paragraph_index, start_offset, end_offset,
  highlighted_text, explanation, is_edited, original_explanation,
  created_at, updated_at

votes
  id, highlight_id, user_id, vote_type (agree/disagree),
  created_at, updated_at

comments
  id, highlight_id, user_id, text, reply_to_id (FK → comments, nullable),
  created_at

highlight_clusters
  id, article_id, paragraph_index, highlight_ids[],
  agreement_count, created_at, updated_at

replacement_rules
  id, source_id, pattern (regex), replacement_text,
  is_regex (boolean), created_at, updated_at

feed_config (replaces feed_sources)
  id, source_id, name, feed_url, default_tags (JSONB),
  publish_mode (auto/manual), last_fetch_at, last_fetch_status,
  is_active, created_at

notifications
  id, user_id, type, reference_id, message, is_read,
  acknowledged_by (for admin notifications), created_at
```

---

## Out of Scope

- Topic grouping / NLP clustering (articles listed by date only)
- Real-time collaborative highlighting (WebSocket-based live updates)
- Mobile-native apps (web responsive only)
- Full web scraping (RSS parsing only)
- User-to-user messaging beyond highlight discussions
- Public API for third-party consumers
- Machine learning-based propaganda auto-detection
- Moderation tools beyond admin article review (e.g., banning users, removing others' highlights)
- Email/push notifications (in-app only)
- Nested/threaded comment replies (flat chronological only)
- Full edit history on highlights (original vs. current only)
- Dedicated notifications page (dropdown only)

---

## Resolved Decisions

1. **Notification delivery** — In-app only. No email/push extensibility needed for now.
2. **Score formula** — Hardcode the weighting formula initially. Tune based on real usage data, not admin configuration.
3. **Anonymous rate limits** — 20 highlights per session per article, 100 per day per IP.
4. **Edit history** — Original vs. current only. No full version history.
