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

The app works out of the box with in-memory storage (flags are lost on restart). To persist articles and flags across sessions, set up a PostgreSQL database:

1. Create a `.env` file from the example:
   ```bash
   cp .env.example .env
   ```
2. Set your `DATABASE_URL` in `.env`:
   ```
   DATABASE_URL=postgresql://localhost:5432/icallbullshit
   ```
3. Tables are created automatically on server start (auto-migration).

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
| `npm run fetch-articles` | Fetch fresh articles from 8 RSS feeds into the repository |
| `npm run migrate` | Run database migrations (requires DATABASE_URL) |

## Architecture

```
Browser (:5173) → Vite proxy → Express API (:3001) → Repository Interface → PostgreSQL
                                                                           → InMemory (fallback)

Fetch Script → Repository Interface → PostgreSQL / InMemory
```

The **repository pattern** decouples all storage from the rest of the app. Swapping databases requires zero changes to routes, UI, or business logic — just implement the `ArticleRepository` and `FlagRepository` interfaces and update the factory.

## How It Works

1. **Articles are ingested** from 8 news sources via RSS feeds (Fox News, CNN, BBC, Reuters, MSNBC, AP News, New York Post, The Guardian). Articles are stored in the database and served via the API. Seed articles load automatically when the database is empty.
2. **Identifying info is stripped** — source name, author, and URL are removed by the API before reaching the browser
3. **You read blind** — judge the writing on its own merit, not the masthead
4. **Flag what you spot** — highlight a passage in the article, write a short explanation of the propaganda technique you see, and submit
5. **Flags persist** — saved to the database via the API, flagged passages appear with yellow highlights across sessions

## API

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/articles` | All articles (anonymized, newest first) |
| GET | `/api/articles/:id` | Single article (anonymized) |
| GET | `/api/articles/:id/flags` | Flags for an article |
| POST | `/api/articles/:id/flags` | Create a flag (body: `{ highlightedText, explanation }`) |

## Project Structure

```
src/
├── types/                  Core data types
│   ├── Article.ts            Article and AnonymizedArticle interfaces
│   └── PropagandaFlag.ts     PropagandaFlag interface
├── repositories/           Storage layer (swappable)
│   ├── ArticleRepository.ts  Interface for article storage
│   ├── FlagRepository.ts     Interface for flag storage
│   ├── InMemoryArticleRepository.ts   Map-based (tests/fallback)
│   ├── InMemoryFlagRepository.ts      Map-based (tests/fallback)
│   ├── PostgresArticleRepository.ts   PostgreSQL implementation
│   ├── PostgresFlagRepository.ts      PostgreSQL implementation
│   └── createRepositories.ts          Factory — picks impl via DATABASE_URL
├── db/                     Database infrastructure
│   ├── migrations/           SQL migration files
│   ├── migrate.ts            Migration runner
│   └── pool.ts               PostgreSQL connection pool
├── server/                 Express API
│   ├── app.ts                Express app assembly
│   ├── index.ts              Entry point (migrate, seed, listen)
│   ├── seedLoader.ts         Loads seed articles when DB is empty
│   └── routes/
│       ├── articles.ts       GET /api/articles, GET /api/articles/:id
│       └── flags.ts          GET/POST /api/articles/:id/flags
├── services/               Business logic
│   ├── anonymize.ts          Strips source-identifying fields
│   ├── RssParser.ts          Parses RSS 2.0 and Atom feeds into Articles
│   └── RssFetcher.ts         Fetches RSS feed XML with timeout handling
├── data/
│   ├── seedArticles.ts       12 real-world-style articles for demo/testing
│   └── feedSources.ts        RSS feed URLs and config for 8 news sources
├── scripts/
│   └── fetchArticles.ts      CLI script to fetch, parse, dedupe, and save articles
└── ui/                     React components
    ├── main.tsx              Entry point
    ├── App.tsx               Root component — async article loading, view switching
    ├── ArticleList.tsx       Scrollable list of article cards
    ├── ArticleCard.tsx       Clickable card showing title, subtitle, and tags
    ├── ArticleReader.tsx     Full article view with API-backed flags
    ├── HighlightedParagraph.tsx  Renders paragraph with flagged text marked
    ├── FlagPopover.tsx       Text selection popover for submitting flags
    ├── highlightText.ts      Pure function to split text by highlight regions
    ├── getSelectionInfo.ts   Wrapper around browser Selection API
    ├── apiClient.ts          Browser API client (articles, flags)
    └── articleData.ts        Async article loader (API or seed fallback)
```

## Testing

Tests are split into two Jest projects that run together:

```bash
npm test
```

- **services** (Node environment) — repositories, contract tests, API routes, seed data, RSS parsing
- **components** (jsdom environment) — React component rendering, user interaction, API client

147 tests across 23 suites. PostgreSQL contract tests (19 tests, 2 suites) auto-skip when `DATABASE_URL` is not set.

## Tech Stack

- **TypeScript** with strict mode
- **React 19** for the UI
- **Express 5** for the API server
- **PostgreSQL** via `pg` (default database)
- **Vite** for dev server and builds
- **Jest + ts-jest** for service tests
- **React Testing Library** for component tests
- **supertest** for API route tests
- **Plain CSS** with BEM naming
- **fast-xml-parser** for RSS/Atom feed parsing

## What's Built So Far

- [x] Core types (Article, AnonymizedArticle, PropagandaFlag)
- [x] Anonymization service
- [x] Repository pattern with swappable storage (InMemory + PostgreSQL)
- [x] Express API server with article and flag endpoints
- [x] Seed articles from 8 news sources
- [x] Article browser UI (list and reader views)
- [x] Text highlighting and propaganda flagging UI
- [x] Persistent flags via database (survive page refresh)
- [x] Daily RSS article ingestion from 8 news sources
- [ ] Source leaderboard / aggregate stats
