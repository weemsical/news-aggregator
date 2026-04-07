# I Call BullShit

Read the news. Spot the spin.

A web app that strips identifying information from news articles and lets you read them blind — no source, no author, no branding. Select specific passages you think are propaganda, explain why, and submit your highlight. The app tracks which sources accumulate the most propaganda through a weighted scoring system, revealed only on a logged-in scores page.

## Quick Start

**Prerequisites:** Node.js 20+, npm, and either Docker or a local PostgreSQL instance.

```bash
npm start
```

This runs the setup script which:
1. Starts a Postgres container via Docker (or uses your existing `DATABASE_URL`)
2. Installs dependencies if needed
3. Runs database migrations automatically
4. Loads seed articles (12 real-world-style articles from 8 sources)
5. Starts both the API server (port 3001) and Vite dev server (port 5173)

Open [http://localhost:5173](http://localhost:5173) in your browser.

**Manual setup** (if you don't want Docker):

```bash
cp .env.example .env
# Edit .env with your DATABASE_URL, JWT_SECRET, ADMIN_EMAILS
npm install
npm run dev
```

## Database Setup

PostgreSQL is required — there is no in-memory fallback.

Set your connection in `.env`:
```
DATABASE_URL=postgresql://localhost:5432/icallbullshit
JWT_SECRET=change-me-to-a-random-secret
ADMIN_EMAILS=admin@example.com
```

Tables are created automatically on server start (auto-migration). `JWT_SECRET` is required in production. `ADMIN_EMAILS` is a comma-separated list of email addresses that have admin access.

Free PostgreSQL hosting: [Neon](https://neon.tech), [Supabase](https://supabase.com), [Railway](https://railway.app), [Render](https://render.com).

## How It Works

1. **Articles are ingested** from 8 built-in news sources via RSS feeds (Fox News, CNN, BBC, Reuters, MSNBC, AP News, New York Post, The Guardian). Admins can add more sources at runtime.
2. **Raw articles are preserved** in a separate table; processed/anonymized articles are what readers see.
3. **Identifying info is stripped** — source name, author, and URL are removed before reaching the browser.
4. **You read blind** — judge the writing on its own merit, not the masthead.
5. **Sign up / log in** — create an account to highlight articles (read-only access without an account).
6. **Highlight what you spot** — select a passage in the article, write a short explanation of the propaganda technique you see, and submit. Selections automatically snap to word boundaries.
7. **Edit or delete** — logged-in users can edit their own explanations (tagged "edited" with original on hover) or delete their highlights entirely.
8. **Toggle your view** — switch between "My Highlights", "All Highlights", or "None" to compare your highlights against everyone else's.
9. **Highlights persist** — saved to the database via the API, highlighted passages appear in blue across sessions.
10. **Admin panel** — admins can add/remove RSS feed sources and trigger immediate article fetches.

## Planned Features (Phases 2-6)

See [docs/PRD-propaganda-highlighting.md](docs/PRD-propaganda-highlighting.md) and [docs/PLAN-propaganda-highlighting.md](docs/PLAN-propaganda-highlighting.md) for the full roadmap:

- **Phase 2:** Anonymous highlighting (yellow, rate-limited, drives sign-ups) + visibility toggle
- **Phase 3:** Agree/disagree voting, threaded discussions per highlight, 50% overlap clustering
- **Phase 4:** Weighted propaganda scoring with 3-vote minimum, source scores page (only place source names appear)
- **Phase 5:** Admin dashboard with sidebar nav, per-source text replacement rules, article review queue
- **Phase 6:** Scheduled daily RSS ingestion (cron, parallel with retry), in-app notification system

## API

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| POST | `/api/auth/signup` | No | Create account |
| POST | `/api/auth/login` | No | Log in, sets JWT cookie |
| POST | `/api/auth/logout` | No | Clear JWT cookie |
| GET | `/api/auth/me` | Yes | Current user (includes `isAdmin`) |
| GET | `/api/articles` | No | All approved articles (anonymized, newest first) |
| GET | `/api/articles/:id` | No | Single article (anonymized) |
| GET | `/api/articles/:id/highlights` | No | Highlights for an article (optional `?userId` filter) |
| POST | `/api/articles/:id/highlights` | Yes | Create a highlight (body: `{ paragraphIndex, startOffset, endOffset, highlightedText, explanation }`) |
| PUT | `/api/highlights/:id` | Yes | Update highlight explanation (owner only) |
| DELETE | `/api/highlights/:id` | Yes | Delete a highlight (owner only) |
| GET | `/api/leaderboard` | No | Stubbed — returns `[]` (replaced by scores page in Phase 4) |
| GET | `/api/admin/feed-sources` | Admin | List all sources (static + dynamic) |
| POST | `/api/admin/feed-sources` | Admin | Add a feed source |
| DELETE | `/api/admin/feed-sources/:sourceId` | Admin | Remove a dynamic source |
| POST | `/api/admin/feed-sources/:sourceId/fetch` | Admin | Fetch articles from one source immediately |

## Available Scripts

| Command | What it does |
|---|---|
| `npm start` | Full dev setup: Postgres container + install + migrate + seed + run |
| `npm run dev` | Start Express API + Vite dev server (requires DATABASE_URL) |
| `npm run dev:server` | Start the Express API server only (port 3001) |
| `npm test` | Run all tests (services + components) |
| `npm run build` | Build for production into `dist-ui/` |
| `npm run preview` | Preview the production build locally |
| `npm run fetch-articles` | Fetch fresh articles from all RSS feeds |
| `npm run migrate` | Run database migrations (requires DATABASE_URL) |

## Architecture

```
Browser (:5173) → Vite proxy → Express API (:3001) → Repository Interface → PostgreSQL

RSS Feeds → raw_articles table → anonymization pipeline → articles table
```

The **repository pattern** decouples all storage from the rest of the app. All repositories are PostgreSQL-only (no in-memory fallback). Test-only in-memory implementations live in `src/__tests__/helpers/`.

**Article storage** is split into two tables: `raw_articles` (original RSS content, immutable) and `articles` (processed/anonymized, with review status and propaganda score). Articles are immutable once published — highlight offsets depend on stable text.

**Highlights** use per-paragraph character offsets (`paragraph_index`, `start_offset`, `end_offset`) rather than text matching, for precision and to support future overlap detection.

**Authentication** uses JWT tokens stored in httpOnly cookies. The `requireAuth` middleware protects highlight creation; `optionalAuth` allows unauthenticated read access. The `requireAdmin` middleware gates admin routes by checking the user's email against `ADMIN_EMAILS`.

## Project Structure

```
src/
├── types/                  Core data types
│   ├── Article.ts            Article (with rawArticleId, reviewStatus, propagandaScore)
│   ├── Highlight.ts          Highlight interface (paragraph offsets, edit tracking)
│   ├── RawArticle.ts         Raw article as fetched from RSS
│   ├── User.ts               User interface
│   └── LeaderboardEntry.ts   Leaderboard entry (to be replaced in Phase 4)
├── repositories/           Storage layer (PostgreSQL only)
│   ├── ArticleRepository.ts  Interface for article storage
│   ├── HighlightRepository.ts Interface for highlight storage (CRUD + find by article/user)
│   ├── RawArticleRepository.ts Interface for raw article storage
│   ├── UserRepository.ts     Interface for user storage
│   ├── FeedSourceRepository.ts Interface for feed source storage
│   ├── Postgres*.ts          PostgreSQL implementations
│   └── createRepositories.ts Factory — requires DATABASE_URL
├── db/                     Database infrastructure
│   ├── migrations/           SQL migration files (001-008)
│   ├── migrate.ts            Migration runner
│   └── pool.ts               PostgreSQL connection pool
├── server/                 Express API
│   ├── app.ts                Express app assembly
│   ├── auth.ts               Password hashing, JWT sign/verify, validation
│   ├── index.ts              Entry point (migrate, seed, listen)
│   ├── seedLoader.ts         Loads seed data into raw_articles + articles
│   ├── middleware/
│   │   ├── requireAuth.ts    requireAuth + optionalAuth middleware
│   │   └── requireAdmin.ts   requireAdmin middleware (checks ADMIN_EMAILS)
│   └── routes/
│       ├── articles.ts       GET /api/articles (approved only), GET /api/articles/:id
│       ├── auth.ts           POST signup/login/logout, GET me
│       ├── highlights.ts     CRUD highlights (GET/POST per article, PUT/DELETE by id)
│       ├── leaderboard.ts    GET /api/leaderboard (stubbed for Phase 4)
│       └── admin.ts          CRUD feed sources + fetch-now (admin-protected)
├── services/               Business logic
│   ├── anonymize.ts          Strips source-identifying fields
│   ├── RssParser.ts          Parses RSS 2.0 and Atom feeds into Articles
│   └── RssFetcher.ts         Fetches RSS feed XML with timeout handling
├── data/
│   ├── seedArticles.ts       12 real-world-style articles for demo/testing
│   ├── feedSources.ts        RSS feed URLs for 8 built-in news sources
│   └── getAllFeedSources.ts   Merges static + admin-added sources
├── scripts/
│   └── fetchArticles.ts      CLI script to fetch, parse, dedupe, and save articles
└── ui/                     React components
    ├── main.tsx              Entry point
    ├── App.tsx               Root component — auth, loading, view switching
    ├── AuthContext.tsx        AuthProvider + useAuth hook
    ├── AuthForm.tsx           Login/signup form
    ├── ArticleList.tsx        Article card list
    ├── ArticleCard.tsx        Clickable article card
    ├── ArticleReader.tsx      Full article view with offset-based highlighting
    ├── HighlightToggle.tsx    Three-way toggle: My Highlights / All / None
    ├── HighlightedParagraph.tsx Renders paragraph with offset-based highlights
    ├── HighlightPopover.tsx   Text selection popover (create + edit modes)
    ├── SourceLeaderboard.tsx  Source leaderboard (to be replaced in Phase 4)
    ├── AdminPanel.tsx         Admin panel for feed sources
    ├── highlightText.ts       splitByOffsets — offset-based segment splitting
    ├── getSelectionInfo.ts    Selection API wrapper with word boundary snapping
    ├── apiClient.ts           Browser API client (highlights, auth, admin)
    └── articleData.ts         Async article loader (API or seed fallback)
```

## Testing

```bash
npm test
```

Two Jest projects run together:
- **services** (Node environment) — repositories, API routes, auth, middleware, seed data, RSS parsing, highlight text splitting
- **components** (jsdom environment) — React components, user interaction, auth context, highlight toggle/popover, API client

274 tests across 33 suites. PostgreSQL integration tests (3 suites) auto-skip when `DATABASE_URL` is not set.

## Tech Stack

- **TypeScript** with strict mode
- **React 19** for the UI
- **Express 5** for the API server
- **PostgreSQL** via `pg` (required)
- **bcryptjs** for password hashing
- **jsonwebtoken** for JWT auth
- **cookie-parser** for httpOnly cookie sessions
- **Vite** for dev server and builds
- **Jest + ts-jest** for service tests
- **React Testing Library** for component tests
- **supertest** for API route tests
- **Plain CSS** with BEM naming
- **fast-xml-parser** for RSS/Atom feed parsing
