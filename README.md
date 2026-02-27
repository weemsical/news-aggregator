# I Call BullShit

Read the news. Spot the spin.

A web app that strips identifying information from news articles and lets you read them blind — no source, no author, no branding. Your job is to highlight passages you think are propaganda and explain why. The app tracks which sources accumulate the most flags, revealed only in aggregate.

## Quick Start

**Prerequisites:** Node.js 20+ and npm. If you use [nvm](https://github.com/nvm-sh/nvm):

```bash
nvm use
```

**Install and run:**

```bash
npm run start
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

You'll see a list of anonymized news articles. Click one to read the full text. Highlight any passage you think is propaganda, explain why, and submit your flag. Click "Back to articles" to return to the list. Flags persist across page refreshes when a database is connected.

## Database Setup (Optional)

The app works out of the box with in-memory storage (data is lost on restart). To persist articles, flags, and user accounts across sessions, set up a PostgreSQL database:

1. Create a `.env` file from the example:
   ```bash
   cp .env.example .env
   ```
2. Set your `DATABASE_URL`, `JWT_SECRET`, and optionally `ADMIN_EMAILS` in `.env`:
   ```
   DATABASE_URL=postgresql://localhost:5432/icallbullshit
   JWT_SECRET=change-me-to-a-random-secret
   ADMIN_EMAILS=admin@example.com
   ```
3. Tables are created automatically on server start (auto-migration).

`JWT_SECRET` is required in production. In development, a default fallback is used.

`ADMIN_EMAILS` is a comma-separated list of email addresses that have admin access. Admins can manage feed sources and trigger article fetches from the UI.

Free PostgreSQL hosting: [Neon](https://neon.tech), [Supabase](https://supabase.com), [Railway](https://railway.app), [Render](https://render.com).

## Available Scripts

| Command | What it does |
|---|---|
| `npm run start` | Install deps, fetch fresh articles, and start both servers |
| `npm run dev` | Start Express API + Vite dev server concurrently |
| `npm run dev:server` | Start the Express API server only (port 3001) |
| `npm test` | Run all tests (services + components) |
| `npm run build` | Build for production into `dist-ui/` |
| `npm run preview` | Preview the production build locally |
| `npm run fetch-articles` | Fetch fresh articles from all RSS feeds (static + admin-added) into the repository |
| `npm run migrate` | Run database migrations (requires DATABASE_URL) |

## Architecture

```
Browser (:5173) → Vite proxy → Express API (:3001) → Repository Interface → PostgreSQL
                                                                           → InMemory (fallback)

Fetch Script → Repository Interface → PostgreSQL / InMemory
```

The **repository pattern** decouples all storage from the rest of the app. Swapping databases requires zero changes to routes, UI, or business logic — just implement the `ArticleRepository`, `FlagRepository`, `UserRepository`, and `FeedSourceRepository` interfaces and update the factory.

**Authentication** uses JWT tokens stored in httpOnly cookies. The server sets the cookie on signup/login and clears it on logout. The `requireAuth` middleware protects flag creation; `optionalAuth` allows unauthenticated read access. The `requireAdmin` middleware gates admin routes by checking the user's email against the `ADMIN_EMAILS` env var.

## How It Works

1. **Articles are ingested** from 8 built-in news sources via RSS feeds (Fox News, CNN, BBC, Reuters, MSNBC, AP News, New York Post, The Guardian). Admins can add more sources at runtime. Articles are stored in the database and served via the API. Seed articles load automatically when the database is empty.
2. **Identifying info is stripped** — source name, author, and URL are removed by the API before reaching the browser
3. **You read blind** — judge the writing on its own merit, not the masthead
4. **Sign up / log in** — create an account to flag articles (read-only access without an account)
5. **Flag what you spot** — highlight a passage in the article, write a short explanation of the propaganda technique you see, and submit
6. **Toggle your view** — switch between "My Flags", "All Flags", or "None" to compare your flags against everyone else's
7. **Flags persist** — saved to the database via the API, flagged passages appear with yellow highlights across sessions
8. **Source leaderboard** — see which news sources accumulate the most propaganda flags, ranked by total flag count
9. **Admin panel** — admins can add/remove RSS feed sources and trigger immediate article fetches without redeploying

## API

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| POST | `/api/auth/signup` | No | Create account (body: `{ email, password }`) |
| POST | `/api/auth/login` | No | Log in, sets JWT cookie (body: `{ email, password }`) |
| POST | `/api/auth/logout` | No | Clear JWT cookie |
| GET | `/api/auth/me` | Yes | Current user from JWT (includes `isAdmin`) |
| GET | `/api/articles` | No | All articles (anonymized, newest first) |
| GET | `/api/articles/:id` | No | Single article (anonymized) |
| GET | `/api/articles/:id/flags` | No | Flags for an article (optional `?userId` filter) |
| POST | `/api/articles/:id/flags` | Yes | Create a flag (body: `{ highlightedText, explanation }`) |
| GET | `/api/leaderboard` | No | Source leaderboard ranked by flag count |
| GET | `/api/admin/feed-sources` | Admin | List all sources (static + dynamic) |
| POST | `/api/admin/feed-sources` | Admin | Add a feed source (body: `{ sourceId, name, feedUrl, defaultTags }`) |
| DELETE | `/api/admin/feed-sources/:sourceId` | Admin | Remove a dynamic source |
| POST | `/api/admin/feed-sources/:sourceId/fetch` | Admin | Fetch articles from one source immediately |

## Project Structure

```
src/
├── types/                  Core data types
│   ├── Article.ts            Article and AnonymizedArticle interfaces
│   ├── PropagandaFlag.ts     PropagandaFlag interface (with userId)
│   └── User.ts               User interface
├── repositories/           Storage layer (swappable)
│   ├── ArticleRepository.ts  Interface for article storage
│   ├── FlagRepository.ts     Interface for flag storage (incl. findByArticleAndUser)
│   ├── UserRepository.ts     Interface for user storage
│   ├── FeedSourceRepository.ts Interface for feed source storage
│   ├── InMemory*.ts          Map-based implementations (tests/fallback)
│   ├── Postgres*.ts          PostgreSQL implementations
│   └── createRepositories.ts Factory — picks impl via DATABASE_URL
├── db/                     Database infrastructure
│   ├── migrations/           SQL migration files (001-004)
│   ├── migrate.ts            Migration runner
│   └── pool.ts               PostgreSQL connection pool
├── server/                 Express API
│   ├── app.ts                Express app assembly (with cookie-parser)
│   ├── auth.ts               Password hashing, JWT sign/verify, validation
│   ├── index.ts              Entry point (migrate, seed, listen)
│   ├── seedLoader.ts         Loads seed articles when DB is empty
│   ├── middleware/
│   │   ├── requireAuth.ts    requireAuth + optionalAuth middleware
│   │   └── requireAdmin.ts   requireAdmin middleware (checks ADMIN_EMAILS)
│   └── routes/
│       ├── articles.ts       GET /api/articles, GET /api/articles/:id
│       ├── auth.ts           POST signup/login/logout, GET me (with isAdmin)
│       ├── flags.ts          GET/POST /api/articles/:id/flags (auth-protected POST)
│       ├── leaderboard.ts    GET /api/leaderboard
│       └── admin.ts          CRUD feed sources + fetch-now (admin-protected)
├── services/               Business logic
│   ├── anonymize.ts          Strips source-identifying fields
│   ├── RssParser.ts          Parses RSS 2.0 and Atom feeds into Articles
│   └── RssFetcher.ts         Fetches RSS feed XML with timeout handling
├── data/
│   ├── seedArticles.ts       12 real-world-style articles for demo/testing
│   ├── feedSources.ts        RSS feed URLs and config for 8 built-in news sources
│   └── getAllFeedSources.ts   Merges static + admin-added sources (DB wins on collision)
├── scripts/
│   └── fetchArticles.ts      CLI script to fetch, parse, dedupe, and save articles
└── ui/                     React components
    ├── main.tsx              Entry point
    ├── App.tsx               Root component — AuthProvider, async loading, view switching
    ├── AuthContext.tsx        AuthProvider + useAuth hook (JWT cookie sessions)
    ├── AuthForm.tsx           Modal login/signup form with validation
    ├── ArticleList.tsx        Scrollable list of article cards
    ├── ArticleCard.tsx        Clickable card showing title, subtitle, and tags
    ├── ArticleReader.tsx      Full article view with auth-gated flagging and toggle
    ├── FlagToggle.tsx         Three-way toggle: My Flags / All Flags / None
    ├── HighlightedParagraph.tsx  Renders paragraph with flagged text marked
    ├── FlagPopover.tsx        Text selection popover for submitting flags
    ├── SourceLeaderboard.tsx  Source leaderboard ranked by flag count
    ├── AdminPanel.tsx         Admin panel for managing feed sources
    ├── highlightText.ts       Pure function to split text by highlight regions
    ├── getSelectionInfo.ts    Wrapper around browser Selection API
    ├── apiClient.ts           Browser API client (articles, flags, auth, admin)
    └── articleData.ts         Async article loader (API or seed fallback)
```

## Testing

Tests are split into two Jest projects that run together:

```bash
npm test
```

- **services** (Node environment) — repositories, contract tests, API routes, auth utilities, middleware, seed data, RSS parsing
- **components** (jsdom environment) — React component rendering, user interaction, auth context, flag toggle, API client

302 tests across 38 suites. PostgreSQL contract tests (38 tests, 4 suites) auto-skip when `DATABASE_URL` is not set.

## Tech Stack

- **TypeScript** with strict mode
- **React 19** for the UI
- **Express 5** for the API server
- **PostgreSQL** via `pg` (default database)
- **bcryptjs** for password hashing
- **jsonwebtoken** for JWT auth
- **cookie-parser** for httpOnly cookie sessions
- **Vite** for dev server and builds
- **Jest + ts-jest** for service tests
- **React Testing Library** for component tests
- **supertest** for API route tests
- **Plain CSS** with BEM naming
- **fast-xml-parser** for RSS/Atom feed parsing

## What's Built So Far

- [x] Core types (Article, AnonymizedArticle, PropagandaFlag, User)
- [x] Anonymization service
- [x] Repository pattern with swappable storage (InMemory + PostgreSQL)
- [x] Express API server with article and flag endpoints
- [x] User authentication (signup, login, logout) with JWT httpOnly cookies
- [x] Auth-protected flag creation (flags tied to user accounts)
- [x] Three-way flag toggle (My Flags / All Flags / None)
- [x] Seed articles from 8 news sources
- [x] Article browser UI (list and reader views)
- [x] Text highlighting and propaganda flagging UI
- [x] Persistent flags via database (survive page refresh)
- [x] Daily RSS article ingestion from 8 news sources
- [x] Source leaderboard — ranked by total propaganda flags per source
- [x] Admin panel — add/remove RSS feed sources at runtime, trigger immediate fetches
- [x] Admin access control via `ADMIN_EMAILS` environment variable
