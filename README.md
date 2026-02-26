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

You'll see a list of anonymized news articles. Click one to read the full text. Highlight any passage you think is propaganda, explain why, and submit your flag. Click "Back to articles" to return to the list.

## Available Scripts

| Command | What it does |
|---|---|
| `npm run start` | Install deps, fetch fresh articles, and start the dev server |
| `npm run dev` | Start the Vite dev server with hot reload |
| `npm test` | Run all tests (services + components) |
| `npm run build` | Build for production into `dist-ui/` |
| `npm run preview` | Preview the production build locally |
| `npm run fetch-articles` | Fetch fresh articles from 8 RSS feeds into `public/articles.json` |

## How It Works

1. **Articles are ingested** from 8 news sources via RSS feeds (Fox News, CNN, BBC, Reuters, MSNBC, AP News, New York Post, The Guardian). Fetched articles appear first, with seed articles filling in underneath. As fresh articles arrive from a source, one seed from that source is replaced.
2. **Identifying info is stripped** — source name, author, and URL are removed before you see anything
3. **You read blind** — judge the writing on its own merit, not the masthead
4. **Flag what you spot** — highlight a passage in the article, write a short explanation of the propaganda technique you see, and submit
5. **Your flags are highlighted** — flagged passages appear with yellow highlights so you can see what you've already spotted

## Project Structure

```
src/
├── types/                  Core data types
│   ├── Article.ts            Article and AnonymizedArticle interfaces
│   └── PropagandaFlag.ts     PropagandaFlag interface
├── services/               Business logic
│   ├── anonymize.ts          Strips source-identifying fields
│   ├── ArticleStore.ts       In-memory article storage, only exposes anonymized data
│   ├── FlagStore.ts          Stores propaganda flags with validation
│   ├── RssParser.ts          Parses RSS 2.0 and Atom feeds into Articles
│   ├── RssFetcher.ts         Fetches RSS feed XML with timeout handling
│   └── ArticlePersistence.ts Reads/writes articles as JSON to disk
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
    ├── ArticleReader.tsx     Full article view with highlighting and flag popover
    ├── HighlightedParagraph.tsx  Renders paragraph with flagged text marked
    ├── FlagPopover.tsx       Text selection popover for submitting flags
    ├── highlightText.ts      Pure function to split text by highlight regions
    ├── getSelectionInfo.ts   Wrapper around browser Selection API
    └── articleData.ts        Async article loader (fetched JSON or seed fallback)
```

## Testing

Tests are split into two Jest projects that run together:

```bash
npm test
```

- **services** (Node environment) — types, stores, anonymization, seed data integration
- **components** (jsdom environment) — React component rendering, user interaction, navigation

131 tests across 19 suites. All tests run on every `npm test` invocation.

## Tech Stack

- **TypeScript** with strict mode
- **React 19** for the UI
- **Vite** for dev server and builds
- **Jest + ts-jest** for service tests
- **React Testing Library** for component tests
- **Plain CSS** with BEM naming
- **fast-xml-parser** for RSS/Atom feed parsing

## What's Built So Far

- [x] Core types (Article, AnonymizedArticle, PropagandaFlag)
- [x] Anonymization service
- [x] In-memory article and flag stores
- [x] Seed articles from 8 news sources
- [x] Article browser UI (list and reader views)
- [x] Text highlighting and propaganda flagging UI
- [x] Daily RSS article ingestion from 8 news sources
- [ ] Source leaderboard / aggregate stats
