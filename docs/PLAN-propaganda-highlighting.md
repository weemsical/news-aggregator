# Implementation Plan: Granular Propaganda Highlighting & Scoring System

> Based on [PRD-propaganda-highlighting.md](./PRD-propaganda-highlighting.md)  
> Approach: Vertical tracer-bullet slices — each phase delivers end-to-end functionality across schema, repository, service, API, and UI layers.

---

## Phase 1: Core Highlighting & Article Restructure (Logged-in Users)

**Goal:** Replace the flag system with text-span highlighting for logged-in users. Restructure articles into raw + processed tables. Drop the in-memory repository fallback. A user can select text in an article, mark it as propaganda with an explanation, and see their own highlights on return.

### User Stories
- As a logged-in user, I want to select text and mark it as propaganda with an explanation
- As a logged-in user, I want to see my own highlights when I return to an article
- As a logged-in user, I want to edit my explanation (tagged "edited", original on hover)
- As a logged-in user, I want to delete my own highlights

### Acceptance Criteria
- [ ] Click-and-drag text selection triggers highlight flow; selections snap to word boundaries
- [ ] Highlight is saved with paragraph_index, start_offset, end_offset, highlighted_text, explanation
- [ ] Own highlights render in blue on the article
- [ ] Edit updates explanation, sets is_edited=true, preserves original_explanation (original vs. current only)
- [ ] Delete removes the highlight
- [ ] Existing flag system is fully removed (clean slate — drop propaganda_flags table and data)
- [ ] Articles split into raw_articles + articles tables with FK relationship
- [ ] All InMemory* repositories removed — Postgres only
- [ ] source_id on both raw_articles and articles (denormalized)

### Technical Changes

**Schema:**
- New migration `005_create_raw_articles.sql`: Create `raw_articles` table (id, title, body JSONB, source_id, url, fetched_at)
- New migration `006_restructure_articles.sql`: Add `raw_article_id` FK, `review_status` (default 'approved'), `propaganda_score` (REAL, default 0) to articles table. Migrate existing articles into raw_articles first.
- New migration `007_create_highlights.sql`: Create `highlights` table (id, article_id, user_id, paragraph_index, start_offset, end_offset, highlighted_text, explanation, is_edited BOOLEAN default false, original_explanation, created_at, updated_at)
- New migration `008_drop_flags.sql`: Drop `propaganda_flags` table

**Types:**
- New `src/types/Highlight.ts` replacing `PropagandaFlag.ts`
- New `src/types/RawArticle.ts`
- Update `src/types/Article.ts` — add raw_article_id, review_status, propaganda_score

**Repository:**
- New `HighlightRepository` interface (Postgres only): save, update, delete, findByArticle, findByArticleAndUser, findById
- New `PostgresHighlightRepository`
- New `RawArticleRepository` interface + `PostgresRawArticleRepository`
- Update `PostgresArticleRepository` — findAll returns only approved articles, add raw_article_id to save
- Remove ALL `InMemory*` repository files
- Remove `FlagRepository`, `PostgresFlagRepository`
- Update `createRepositories.ts` — Postgres only, add highlight + raw article repos

**API:**
- New `src/server/routes/highlights.ts`: CRUD endpoints replacing flags routes
  - `GET /api/articles/:id/highlights` (optionalAuth)
  - `POST /api/articles/:id/highlights` (requireAuth)
  - `PUT /api/highlights/:id` (requireAuth, owner only)
  - `DELETE /api/highlights/:id` (requireAuth, owner only)
- Remove `src/server/routes/flags.ts`
- Update `app.ts` to mount new routes

**Seed Data:**
- Update `src/server/seedLoader.ts` — populate both `raw_articles` and `articles` tables from seed data
- Seed articles get review_status="approved" and propaganda_score=0

**Frontend:**
- Replace `FlagPopover` with `HighlightPopover` — explanation field, edit/delete for own highlights
- Replace `HighlightedParagraph` — render from new highlight data model (paragraph_index + offsets)
- Implement word boundary snapping using Browser Selection API
- Replace `FlagToggle` with `HighlightToggle` (simplified for now — own highlights only)
- Update `ArticleReader` to use new highlight flow
- Update `apiClient.ts` — new highlight CRUD functions replacing flag functions
- Remove `highlightText.ts` (replace with offset-based rendering)

**Tests:**
- HighlightRepository tests (Postgres, replacing contract test pattern)
- RawArticleRepository tests
- Highlight route integration tests (CRUD, auth, ownership, word boundary snapping)
- HighlightPopover component tests
- HighlightedParagraph component tests (offset-based rendering)
- Remove all flag-related tests and InMemory repository tests

### Checkpoint
All existing tests updated to remove flag and in-memory references. New highlight tests pass. A logged-in user can create, view, edit, and delete highlights end-to-end. Articles stored as raw + processed.

---

## Phase 2: Anonymous Highlighting & Visibility Toggle

**Goal:** Anonymous users can highlight text (no explanation, saved as "anon"), and all users can toggle visibility of others' highlights. Logged-in users see blue (registered) and yellow (anon); anonymous users see all as yellow.

### User Stories
- As an anonymous user, I want to highlight text without an explanation
- As a reader, I want to toggle others' highlights on/off (default: off)
- As a logged-in user with highlights on, I want to see blue (registered) and yellow (anon) highlights
- As an anonymous user with highlights on, I want to see all highlights in yellow

### Acceptance Criteria
- [ ] Anonymous users get a simplified popover (no explanation field, one-click mark)
- [ ] All anonymous highlights saved with user_id = "anon"
- [ ] Anonymous highlights cannot be edited or deleted
- [ ] Rate limiting at API layer: 20 highlights per session per article, 100 per day per IP
- [ ] Sign-up prompt shown to anon users: "Create an account for your highlights to count"
- [ ] Toggle at top of article: "Show highlights" on/off (default off)
- [ ] When off, only own highlights visible (anon sees nothing if they have no session highlights)
- [ ] When on, color coding applies per user type

### Technical Changes

**Dependencies:**
- Install `express-rate-limit`

**API:**
- Update `POST /api/articles/:id/highlights` — allow unauthenticated requests, save as user_id="anon"
- No explanation required when user_id="anon"
- Add rate limiting middleware for anonymous highlight creation (session + IP-based)

**Frontend:**
- Update `HighlightPopover` — conditional: one-click mark for anon, explanation form for logged-in
- Update `HighlightedParagraph` — color coding: blue for registered user highlights, yellow for anon
- New `HighlightToggle` component — on/off toggle (default off)
- Update `ArticleReader` — integrate toggle state, filter highlights accordingly
- New `SignUpPrompt` component for anonymous users

**Tests:**
- Anonymous highlight creation (no auth, no explanation, saved as "anon")
- Rate limiting tests (session + IP limits)
- Toggle behavior tests (on/off states, color coding per user type)
- Anon highlights not editable/deletable
- Sign-up prompt displayed for anon

### Checkpoint
All Phase 1 + Phase 2 tests pass. Anonymous highlighting works end-to-end. Toggle correctly filters and color-codes highlights.

---

## Phase 3: Voting, Discussions & Overlap Agreement

**Goal:** Logged-in users can agree/disagree on others' highlights and discuss them in threaded conversations. Overlapping highlights (50%+ of shorter span) are automatically clustered. New highlights check for overlaps before creation, letting users agree instead of duplicate.

### User Stories
- As a logged-in user, I want to see existing overlapping highlights before creating a duplicate
- As a logged-in user, I want to agree or disagree with another user's highlight
- As a logged-in user, I want to discuss a highlight with other voters
- As the system, I want to cluster overlapping highlights as implicit agreement

### Acceptance Criteria
- [ ] Before creating a highlight, the system checks for 50%+ overlaps (measured against shorter span) and shows matches ranked by match percentage
- [ ] User can agree with an existing highlight or choose "create new"
- [ ] Agree/disagree buttons on each blue highlight (when expanded)
- [ ] One vote per user per highlight; cannot vote on own highlights
- [ ] Votes are permanent — can flip but never be removed; vote changes shown in thread
- [ ] Disagree requires mandatory reason text
- [ ] After voting, user can post in flat, chronological discussion thread
- [ ] Replies can optionally quote a specific previous comment (collapsed block at top)
- [ ] 250 character comment limit, 50 comment thread cap, warning at 45
- [ ] Non-voters see thread as read-only
- [ ] Overlapping highlights (>= 50% of shorter span) are auto-clustered synchronously
- [ ] Overlap threshold is configurable (default 50%)
- [ ] Anonymous highlights excluded from overlap, voting, and discussions
- [ ] Overlapping highlights display with same blue shade + counter badge
- [ ] Partial overlaps show darker vertical separator lines at boundaries
- [ ] Clicking a highlighted region shows dropdown with explanations, votes, discussion

### Technical Changes

**Schema:**
- New migration `009_create_votes.sql`: Create `votes` table (id, highlight_id, user_id, vote_type VARCHAR, created_at, updated_at). Unique constraint on (highlight_id, user_id). No delete — only update.
- New migration `010_create_comments.sql`: Create `comments` table (id, highlight_id, user_id, text VARCHAR(250), reply_to_id FK nullable, created_at)
- New migration `011_create_highlight_clusters.sql`: Create `highlight_clusters` table (id, article_id, paragraph_index, highlight_ids JSONB, agreement_count, created_at, updated_at)

**Types:**
- New `src/types/Vote.ts`
- New `src/types/Comment.ts`
- New `src/types/HighlightCluster.ts`

**Repository:**
- New `VoteRepository` interface + `PostgresVoteRepository`: save (upsert), findByHighlight, findByHighlightAndUser
- New `CommentRepository` interface + `PostgresCommentRepository`: save, findByHighlight, countByHighlight
- New `HighlightClusterRepository` interface + `PostgresHighlightClusterRepository`: save, update, findByArticle, findByParagraph

**Service:**
- New `src/services/OverlapService.ts`:
  - `findOverlaps(articleId, paragraphIndex, startOffset, endOffset)` — returns overlapping highlights ranked by match percentage
  - `calculateOverlapPercentage(highlight1, highlight2)` — measures against shorter span
  - `updateClusters(articleId, paragraphIndex)` — recalculates clusters synchronously
- Cluster recalculation triggered on highlight create/delete

**API:**
- New `GET /api/articles/:id/highlights/check-overlap` (requireAuth) — query params: paragraphIndex, startOffset, endOffset. Returns overlapping highlights ranked by match %.
- New `src/server/routes/votes.ts`:
  - `POST /api/highlights/:id/votes` (requireAuth) — create or update vote (upsert, no delete)
  - `GET /api/highlights/:id/votes` (optionalAuth) — vote counts + user's own vote
- New `src/server/routes/comments.ts`:
  - `GET /api/highlights/:id/comments` (optionalAuth) — flat chronological list
  - `POST /api/highlights/:id/comments` (requireAuth) — must have voted first; validates 250 char limit and 50 comment cap
- Update `GET /api/articles/:id/highlights` — include vote counts, cluster info, comment counts in response

**Frontend:**
- New `OverlapCheckModal` — shown before highlight creation; lists existing overlapping highlights with "Agree" buttons and "None of these — create new"
- New `VotingControls` component — agree/disagree buttons with counts
- New `DiscussionThread` component — flat comment list with quoted replies, vote-change indicators, 45-comment warning
- New `CommentInput` component — 250 char limit, optional reply-to quoting
- Update `HighlightPopover` — integrate overlap check before explanation form
- Update `HighlightedParagraph` — render overlap clusters with counter badge, vertical separators for partial overlaps
- New `HighlightDropdown` — shows explanations, voting controls, discussion thread

**Tests:**
- OverlapService unit tests (50% threshold against shorter span, edge cases, configurable threshold, ranking by match %)
- VoteRepository tests (upsert, no delete, unique constraint)
- CommentRepository tests (250 char limit, 50 cap, reply_to)
- Vote route integration tests (auth, one-vote-per-user, can't vote on own, flip but no delete)
- Comment route integration tests (must vote first, char limit, thread cap, warning at 45)
- Overlap check endpoint tests
- Cluster creation/update on highlight changes
- Frontend: OverlapCheckModal, VotingControls, DiscussionThread, overlap display

### Checkpoint
All Phase 1-3 tests pass. Pre-creation overlap check works. Voting and discussions work end-to-end. Overlapping highlights are visually clustered with counters.

---

## Phase 4: Scoring & Source Scores Page

**Goal:** Articles receive propaganda scores based on weighted agreement (minimum 3 votes per highlight). A logged-in-only scores page shows source names ranked by aggregate propaganda score — the only place source names are revealed. Article listing updated with date-seeded shuffle and sort by propaganda count.

### User Stories
- As the system, I want to calculate a propaganda score for each article based on weighted agreement
- As a logged-in user, I want to see a ranked list of sources by propaganda score
- As a reader, I want to sort articles by propaganda count

### Acceptance Criteria
- [ ] Highlight must have >= 3 total votes (agrees + disagrees) to contribute to article score
- [ ] Below-threshold highlights visible but don't affect scoring
- [ ] Formula per qualifying cluster: unique_agreeing_users * (agrees / (agrees + disagrees))
- [ ] Article score = sum of all qualifying cluster scores
- [ ] Anonymous highlights/votes excluded entirely
- [ ] Score recalculates immediately (synchronously) when highlights/votes change
- [ ] Scores page shows: source name, average score per article, total accumulated score
- [ ] Ranked highest to lowest
- [ ] No individual articles shown — source-level only
- [ ] Logged-in only (401 for anonymous)
- [ ] Date range filter — filters by article publication date
- [ ] Scores page is the ONLY place source names appear
- [ ] Article list: 20 per page, sort by date (default) or propaganda count
- [ ] Same-date articles use date-seeded daily shuffle (stable within a day)

### Technical Changes

**Service:**
- New `src/services/ScoringService.ts`:
  - `calculateArticleScore(articleId)` — queries clusters + votes, applies weighting formula, enforces 3-vote minimum
  - `recalculateScore(articleId)` — called after highlight/vote changes, updates articles.propaganda_score
  - Formula: sum of (unique_agreeing_users * (agrees / (agrees + disagrees))) per cluster where total_votes >= 3

**API:**
- New `GET /api/scores` (requireAuth) — returns source rankings with average and total scores, supports date range query params
- Update article routes — include propaganda_score in responses
- Update `GET /api/articles` — support `sort=propaganda` query param, implement date-seeded shuffle for same-date articles

**Frontend:**
- New `ScoresPage` component replacing `SourceLeaderboard`
  - Ranked list with source name, average score, total score
  - Date range filter (filters by article publication date)
- Update `ArticleList` — sort dropdown (date / propaganda count), 20 per page
- Implement date-seeded shuffle for same-date articles on frontend
- Remove old leaderboard references from `App.tsx`
- Update nav: Articles | Scores | [Auth]

**Tests:**
- ScoringService unit tests (formula, 3-vote minimum, edge cases, anon exclusion, immediate recalculation)
- Scores route integration tests (auth required, correct aggregation, date range filter)
- Article sort by propaganda count
- Date-seeded shuffle (stable within day, different across days)
- ScoresPage component tests

### Checkpoint
All Phase 1-4 tests pass. Scores calculate correctly with 3-vote minimum. Leaderboard replaced with scores page. Article sorting and date-seeded shuffle work.

---

## Phase 5: Admin Dashboard — Feed Management, Replacement Rules & Article Review

**Goal:** Full admin dashboard with sidebar navigation. Admins manage RSS feeds with per-source auto/manual publish toggle and per-source text replacement rules. Articles from "manual review" sources enter a queue for admin approval. Review view shows replacement-applied text with substitutions highlighted.

### User Stories
- As an admin, I want to set per-source publish mode (auto vs. manual review)
- As an admin, I want to define per-source text replacement rules to strip identifying language
- As an admin, I want to review and approve/reject articles in a queue
- As an admin, I want to add/remove RSS feeds from the dashboard

### Acceptance Criteria
- [ ] Sidebar navigation: feed list on left (click to configure), "Review Queue" as separate nav item
- [ ] Feed management CRUD with per-source publish_mode toggle (auto/manual)
- [ ] Per-source replacement rules: admin enters text or regex
- [ ] Plain text auto-converted to regex with word boundaries; preview shown for approval
- [ ] Rules applied longest-match-first during anonymization
- [ ] Rules apply to new articles only; published articles are immutable
- [ ] Pending articles re-processed when rules change
- [ ] Review view shows article after replacements, with substituted sections highlighted
- [ ] Admin cannot edit article text — adjusts rules and re-previews instead
- [ ] Admin can approve (publish) or reject (delete) each article
- [ ] Articles from "auto" sources saved with review_status="approved"
- [ ] Articles from "manual" sources saved with review_status="pending"

### Technical Changes

**Schema:**
- New migration `012_create_replacement_rules.sql`: Create `replacement_rules` table (id, source_id, pattern TEXT, replacement_text TEXT, is_regex BOOLEAN default false, created_at, updated_at)
- New migration `013_add_publish_mode_to_feeds.sql`: Add `publish_mode` column to `feed_sources` (VARCHAR, default 'auto')

**Types:**
- New `src/types/ReplacementRule.ts`
- Update `src/types/FeedSource.ts` — add publish_mode

**Repository:**
- New `ReplacementRuleRepository` interface + `PostgresReplacementRuleRepository`: save, update, delete, findBySource
- Update `PostgresArticleRepository` — findAll returns only approved articles, add findByReviewStatus
- Update `PostgresFeedSourceRepository` — include publish_mode

**Service:**
- New `src/services/ReplacementService.ts`:
  - `convertToRegex(text)` — wraps plain text in word boundaries
  - `applyRules(body, sourceId)` — fetches rules for source, sorts longest-match-first, applies sequentially, returns processed body + replacement map (for review highlighting)
  - `previewRule(rule, sourceId)` — finds example matches in existing raw articles
- Update `src/services/anonymize.ts` — integrate ReplacementService into the pipeline: apply replacement rules → strip sourceId/url
- Anonymization pipeline order: raw RSS → apply source replacement rules → strip source identifiers → save as articles

**API:**
- New `src/server/routes/replacementRules.ts` (requireAdmin):
  - `GET /api/admin/sources/:sourceId/rules` — list rules
  - `POST /api/admin/sources/:sourceId/rules` — create rule with preview
  - `PUT /api/admin/rules/:id` — update rule
  - `DELETE /api/admin/rules/:id` — delete rule
  - `POST /api/admin/sources/:sourceId/rules/preview` — preview matches
- Update admin routes:
  - `POST /api/admin/feed-sources` — accept publish_mode
  - `PUT /api/admin/feed-sources/:sourceId` — update publish_mode
- New review queue routes (requireAdmin):
  - `GET /api/admin/review-queue` — list pending articles with replacement highlighting
  - `POST /api/admin/articles/:id/approve`
  - `POST /api/admin/articles/:id/reject`
  - `POST /api/admin/articles/:id/reprocess` — re-apply rules and return preview
- Update fetch flow — check source publish_mode when saving new articles

**Frontend:**
- Redesign `AdminPanel` as `AdminDashboard` with sidebar navigation:
  - Sidebar: list of feeds (clickable) + "Review Queue" item
  - Feed detail view: name, URL, publish mode toggle, replacement rules list
- New `ReplacementRuleEditor` component — text/regex input, auto-conversion preview, example matches from articles
- New `ReviewQueue` component — list pending articles across all sources
- New `ArticleReviewCard` — shows processed article with replacement sections highlighted; approve/reject/re-preview buttons
- Update `apiClient.ts` — replacement rules, review queue, and approval functions

**Tests:**
- ReplacementService unit tests (text-to-regex conversion, longest-match-first ordering, rule application, preview)
- ReplacementRuleRepository tests
- Review status filtering in article repository
- Admin replacement rule routes tests
- Admin review queue route tests
- Approve/reject flow integration tests
- Publish mode toggle in feed management
- Articles from auto sources appear immediately, manual sources go to queue
- Re-process pending articles when rules change
- AdminDashboard, ReplacementRuleEditor, ReviewQueue component tests

### Checkpoint
All Phase 1-5 tests pass. Admin dashboard with sidebar nav works. Replacement rules apply correctly. Article review queue works end-to-end with replacement highlighting.

---

## Phase 6: Scheduled Ingestion & Notifications

**Goal:** RSS feeds are automatically fetched daily in parallel before 6 AM server local time with per-feed retry logic. All admins notified of feed failures with shared acknowledgment. Users receive batched/individual notifications for highlight interactions via a dropdown bell.

### User Stories
- As the system, I want to fetch all feeds daily before 6 AM with parallel fetching and per-feed retry
- As an admin, I want to be notified when a feed fails after all retries, and acknowledge for all admins
- As a logged-in user, I want notifications when others interact with my highlights
- As a logged-in user, I want to know when new articles are available

### Acceptance Criteria
- [ ] Cron job starts at 5:00 AM server local time
- [ ] All feeds fetched in parallel; each feed retries independently up to 3 times with exponential backoff
- [ ] After 3 failures, skip source and notify all admins
- [ ] Admin notification resolved when any admin acknowledges OR feed succeeds next run
- [ ] New articles: stored as raw_articles → processed through replacement rules → saved as articles respecting publish_mode
- [ ] Agreement notifications batched (e.g., "5 new agreements on your highlight")
- [ ] Disagreements and replies are individual notifications
- [ ] New article notifications for all users
- [ ] All participants in a highlight discussion thread get notified of new activity
- [ ] Notification bell icon in header with unread count badge
- [ ] Dropdown shows recent notifications with mark-as-read
- [ ] No dedicated notifications page

### Technical Changes

**Dependencies:**
- Install `node-cron`

**Schema:**
- New migration `014_create_notifications.sql`: Create `notifications` table (id, user_id, type VARCHAR, reference_id, message TEXT, is_read BOOLEAN default false, acknowledged_by JSONB default '[]', created_at)

**Types:**
- New `src/types/Notification.ts`

**Repository:**
- New `NotificationRepository` interface + `PostgresNotificationRepository`:
  - save, saveBatch, findByUser (paginated), markAsRead, countUnread
  - For admin notifications: acknowledge (adds user to acknowledged_by array)

**Service:**
- New `src/services/NotificationService.ts`:
  - `notifyAgreement(highlightId)` — batches: groups recent agreements into single notification
  - `notifyDisagreement(highlightId, voterId)` — individual notification
  - `notifyComment(highlightId, commenterId)` — individual notification to all thread participants
  - `notifyNewArticles(articleIds)` — notification for all users
  - `notifyFeedFailure(sourceId, error)` — notification for all admins
  - `resolveAdminNotification(notificationId, adminUserId)` — marks acknowledged
- New `src/services/ScheduledIngestion.ts`:
  - `runIngestion()` — fetches all active feeds in parallel
  - Per-feed: fetch → retry up to 3x with exponential backoff → on success: save raw_articles, apply replacement rules, save articles (respecting publish_mode) → on failure: notify admins
  - Updates last_fetch_at and last_fetch_status on feed_config

**Cron:**
- New `src/server/cron.ts` — node-cron job scheduled for 5:00 AM server local time daily
- Initialized on server startup
- Calls `ScheduledIngestion.runIngestion()`

**API:**
- New `src/server/routes/notifications.ts`:
  - `GET /api/notifications` (requireAuth) — user's recent notifications
  - `GET /api/notifications/unread-count` (requireAuth)
  - `POST /api/notifications/:id/read` (requireAuth)
  - `POST /api/notifications/:id/acknowledge` (requireAdmin) — for feed failure notifications
- Hook notification creation into:
  - Vote creation/update (Phase 3 vote routes)
  - Comment creation (Phase 3 comment routes)
  - Article ingestion (this phase)

**Frontend:**
- New `NotificationBell` component — bell icon with unread count badge in header
- New `NotificationDropdown` — list of recent notifications, mark as read, admin acknowledge button for feed failures
- Update `App.tsx` — add notification bell to header nav: Articles | Scores | [bell] | [Admin] | [Auth]
- Update `apiClient.ts` — notification endpoints

**Tests:**
- ScheduledIngestion service tests (parallel fetch, per-feed retry, exponential backoff, failure notification, respect publish_mode, replacement rules applied)
- NotificationService tests (batching agreements, individual disagrees/replies, thread participant notifications, admin feed failure, acknowledgment resolves for all)
- NotificationRepository tests
- Notification route integration tests
- Cron scheduling tests (verify schedule, job execution)
- NotificationBell + NotificationDropdown component tests
- Integration: vote creates notification for highlight owner
- Integration: comment notifies all thread participants
- Integration: feed failure notifies all admins, acknowledgment works

### Checkpoint
All tests pass across all phases. Full system operational: highlighting, voting, discussions, scoring, admin dashboard with replacement rules, scheduled ingestion with parallel retry, and notification system.

---

## Phase Summary

| Phase | Delivers | Key Risk |
|-------|----------|----------|
| **1** | Core highlighting CRUD, raw/processed article split, drop in-memory repos | Offset-based rendering, migration of existing articles to new structure |
| **2** | Anonymous highlights, visibility toggle, rate limiting | Rate limiting configuration, color-coded rendering |
| **3** | Voting, discussions, overlap clustering, pre-creation overlap check | Overlap algorithm (shorter span), discussion thread UX, vote permanence |
| **4** | Propaganda scoring (3-vote min), scores page, date-seeded shuffle | Score formula correctness, replacing existing leaderboard |
| **5** | Admin dashboard (sidebar nav), replacement rules, article review queue | Replacement rule regex safety, review UX, re-processing pending articles |
| **6** | Parallel cron ingestion, retry logic, batched/individual notifications | Cron reliability, notification batching logic, thread participant tracking |

---

## Dependencies to Install

- `node-cron` — scheduled feed ingestion (Phase 6)
- `express-rate-limit` — anonymous highlight rate limiting (Phase 2)

No other new dependencies required. Existing stack (Express, pg, bcryptjs, jsonwebtoken, fast-xml-parser, React, Jest) covers everything else.
