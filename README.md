# News Aggregator

A modern web service that scrapes news sites and displays top articles from various sources using React and TypeScript.

## Features

- 🚀 **Real-time News Aggregation** - Scrapes multiple news sources automatically
- ⚛️ **React + TypeScript Frontend** - Modern, responsive user interface
- 🔄 **Express.js Backend** - RESTful API with TypeScript
- 📅 **Scheduled Scraping** - Automatic news updates every 30 minutes
- 🎯 **Source Filtering** - Filter articles by news source
- 📱 **Responsive Design** - Works on desktop and mobile devices

## Architecture

```
news-aggregator/
├── frontend/          # React TypeScript application
├── backend/           # Express.js API server
├── shared/            # Shared TypeScript types
└── docs/              # Additional documentation
```

## Quick Start

### Prerequisites

- Node.js 16+ and npm 8+
- Git

### Installation

1. **Clone and setup the project:**
   ```bash
   git clone <repository-url>
   cd news-aggregator
   npm run install:all
   ```

2. **Configure environment (optional):**
   ```bash
   cp backend/.env.example backend/.env
   # Edit backend/.env with your preferred settings
   ```

3. **Start the development servers:**
   ```bash
   npm run dev
   ```
   
   This starts both the backend API (http://localhost:3001) and frontend (http://localhost:3000) simultaneously.

### Available Scripts

- `npm run dev` - Start both frontend and backend in development mode
- `npm run build` - Build both applications for production
- `npm run install:all` - Install dependencies for all packages
- `npm run clean` - Clean all build artifacts and node_modules

## API Endpoints

### GET /api/news
Get articles with pagination and filtering.

**Query Parameters:**
- `page` (number): Page number (default: 1)
- `limit` (number): Articles per page (default: 20, max: 100)
- `source` (string): Filter by news source

**Example:**
```bash
curl "http://localhost:3001/api/news?page=1&limit=10&source=Hacker%20News"
```

### POST /api/news/scrape
Manually trigger news scraping from all sources.

### GET /api/news/sources
Get list of available news sources.

### GET /health
Health check endpoint.

## News Sources

Currently supported news sources:

- **Hacker News** - Top technology and startup stories
- **Reddit** - Popular posts from r/worldnews

## Development

### Frontend Development

The frontend is a React application with TypeScript located in `/frontend`:

```bash
cd frontend
npm start     # Development server
npm run build # Production build
npm test      # Run tests
```

### Backend Development

The backend is an Express.js API server with TypeScript located in `/backend`:

```bash
cd backend
npm run dev   # Development server with auto-reload
npm run build # Compile TypeScript
npm start     # Run compiled JavaScript
```

### Adding New News Sources

1. Create a new scraper class in `/backend/src/services/scrapers/`
2. Implement the `Scraper` interface
3. Add the scraper to the `NewsService` scrapers array
4. The scraper will be automatically included in scheduled runs

Example scraper structure:

```typescript
import { Article, Scraper } from '../../types';

export class YourNewsScraper implements Scraper {
  name = 'Your News Source';
  url = 'https://your-news-site.com';

  async scrape(): Promise<Article[]> {
    // Implementation here
    return articles;
  }
}
```

## Project Structure

### Frontend (`/frontend`)
- `src/App.tsx` - Main React component
- `src/index.tsx` - Application entry point
- `public/` - Static assets

### Backend (`/backend`)
- `src/index.ts` - Express server entry point
- `src/routes/` - API route handlers
- `src/services/` - Business logic and news scrapers
- `src/types/` - TypeScript type definitions

### Shared (`/shared`)
- `types/` - TypeScript interfaces used by both frontend and backend

## Configuration

Environment variables (create `backend/.env` from `backend/.env.example`):

- `PORT` - Server port (default: 3001)
- `SCRAPING_INTERVAL_MINUTES` - How often to scrape news (default: 30)
- `MAX_ARTICLES_STORAGE` - Maximum articles to keep in memory (default: 1000)

## Production Deployment

1. Build the applications:
   ```bash
   npm run build
   ```

2. Serve the frontend build from `/frontend/build`

3. Run the backend server from `/backend/dist`

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Troubleshooting

### Common Issues

1. **Port conflicts**: Change the PORT in `backend/.env` if 3001 is in use
2. **CORS issues**: The backend is configured to allow all origins in development
3. **Scraping failures**: Check console logs for specific scraper error messages

### Development Tips

- Use `npm run dev` to start both servers simultaneously
- Check browser console and terminal for error messages
- The backend automatically scrapes news every 30 minutes
- Use `/api/news/scrape` to manually trigger scraping during development

## Support

If you encounter any issues or have questions, please open an issue on the repository.