# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Common Development Commands

### Project Setup
```bash
npm run install:all              # Install dependencies for all packages
cp backend/.env.example backend/.env   # Create environment configuration
```

### Development
```bash
npm run dev                      # Start both frontend and backend in development mode
npm run dev:frontend            # Start only frontend (http://localhost:3000)
npm run dev:backend             # Start only backend (http://localhost:3001)
```

### Building
```bash
npm run build                   # Build both frontend and backend for production
npm run build:frontend         # Build only frontend to frontend/build
npm run build:backend          # Compile TypeScript to backend/dist
npm run type-check              # Type check both projects
```

### Testing
```bash
# Backend tests
cd backend && npm test          # Run Jest tests for backend

# Frontend tests
cd frontend && npm test         # Run React test suite
```

### Individual Package Commands
```bash
# Backend specific
cd backend
npm run dev                     # Development server with tsx watch
npm run build                   # Compile TypeScript
npm start                       # Run compiled JavaScript

# Frontend specific
cd frontend  
npm start                       # Development server
npm run build                   # Production build
npm test                        # Test runner
```

### Maintenance
```bash
npm run clean                   # Clean all build artifacts and node_modules
```

## Architecture Overview

### Monorepo Structure
This is a TypeScript monorepo with three main packages:
- **frontend/**: React application with TypeScript
- **backend/**: Express.js API server with TypeScript  
- **shared/**: Common TypeScript interfaces and types

### Backend Architecture

#### Core Services
- **NewsService**: Central orchestrator managing articles and scrapers
  - Maintains in-memory article storage (max 1000 articles)
  - Handles pagination, filtering, and deduplication
  - Coordinates multiple news source scrapers

- **Scheduler**: Automated news scraping using node-cron
  - Runs initial scrape on startup
  - Schedules scraping every 30 minutes
  - Configurable via environment variables

#### Scraper Pattern
All news scrapers implement the `Scraper` interface:
```typescript
interface Scraper {
  name: string;
  url: string;
  scrape(): Promise<Article[]>;
}
```

Current scrapers:
- **HackerNewsScraper**: Uses Firebase API to fetch top 30 stories
- **RedditScraper**: Scrapes r/worldnews posts

To add new scrapers:
1. Create class in `backend/src/services/scrapers/`
2. Implement `Scraper` interface
3. Add to `NewsService.scrapers` array

#### API Routes (`/api/news`)
- `GET /` - Paginated articles with optional source filtering
- `POST /scrape` - Manual scraping trigger
- `GET /sources` - List available news sources
- `GET /health` - Health check

### Frontend Architecture

#### Current State
- Basic React + TypeScript setup using Create React App
- **Important**: Frontend is currently a placeholder - `App.tsx` shows "Backend API not yet implemented"
- Shared types imported from `../shared/types`

#### Data Flow (When Implemented)
Frontend will consume backend REST API to:
1. Fetch articles with pagination
2. Filter by news source
3. Display article cards with metadata
4. Trigger manual scraping

### Shared Types
Critical interfaces in `shared/types/index.ts`:
- **Article**: Core news article structure with id, title, url, source, publishedAt
- **APIResponse<T>**: Standardized API response wrapper
- **ArticlesResponse**: Paginated article response
- **NewsSource**: News source configuration
- **ScrapingResult**: Scraping operation metadata

### Data Management
- **In-Memory Storage**: Articles stored in NewsService memory
- **Auto-Cleanup**: Maintains only 1000 most recent articles
- **Deduplication**: Prevents duplicate articles by URL
- **No Database**: Current implementation is stateless

### Environment Configuration
Key environment variables (see `backend/.env.example`):
- `PORT`: Backend server port (default: 3001)
- `SCRAPING_INTERVAL_MINUTES`: Scraping frequency (default: 30)
- `MAX_ARTICLES_STORAGE`: Max articles in memory (default: 1000)

### Development Notes

#### Workspace Setup
- Uses npm workspaces for monorepo management
- TypeScript configurations in each package
- Concurrently runs both servers in development

#### Current Limitations
1. Frontend is not yet connected to backend API
2. No persistent storage - articles lost on restart
3. No user authentication or personalization
4. Limited to 2 news sources

#### Adding New Features
- **New scrapers**: Follow the Scraper interface pattern
- **Frontend development**: Connect to existing backend API endpoints
- **Database integration**: Replace in-memory storage in NewsService
- **Authentication**: Add middleware to Express routes