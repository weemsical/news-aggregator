import { Article, ArticlesResponse, NewsSource, ScrapingResult } from '../types';
import { HackerNewsScraper } from './scrapers/hackerNews';
import { RedditScraper } from './scrapers/reddit';

export class NewsService {
  private articles: Article[] = [];
  private scrapers = [
    new HackerNewsScraper(),
    new RedditScraper()
  ];

  async getArticles(params: {
    page: number;
    limit: number;
    source?: string;
  }): Promise<ArticlesResponse> {
    let filteredArticles = this.articles;

    // Filter by source if specified
    if (params.source) {
      filteredArticles = this.articles.filter(
        article => article.source.toLowerCase() === params.source.toLowerCase()
      );
    }

    // Sort by published date (newest first)
    filteredArticles.sort((a, b) => 
      new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
    );

    // Pagination
    const startIndex = (params.page - 1) * params.limit;
    const endIndex = startIndex + params.limit;
    const paginatedArticles = filteredArticles.slice(startIndex, endIndex);

    return {
      articles: paginatedArticles,
      total: filteredArticles.length,
      page: params.page,
      limit: params.limit
    };
  }

  async scrapeAllSources(): Promise<ScrapingResult[]> {
    const results: ScrapingResult[] = [];

    for (const scraper of this.scrapers) {
      const startTime = Date.now();
      try {
        console.log(`Scraping ${scraper.name}...`);
        const articles = await scraper.scrape();
        
        // Add new articles (avoid duplicates by URL)
        const newArticles = articles.filter(newArticle => 
          !this.articles.some(existingArticle => existingArticle.url === newArticle.url)
        );

        this.articles.push(...newArticles);

        const duration = Date.now() - startTime;
        results.push({
          source: scraper.name,
          articlesFound: newArticles.length,
          duration
        });

        console.log(`✓ ${scraper.name}: Found ${newArticles.length} new articles in ${duration}ms`);
      } catch (error) {
        const duration = Date.now() - startTime;
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        
        results.push({
          source: scraper.name,
          articlesFound: 0,
          errors: [errorMessage],
          duration
        });

        console.error(`✗ ${scraper.name}: ${errorMessage}`);
      }
    }

    // Keep only the most recent 1000 articles to prevent memory bloat
    this.articles = this.articles
      .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
      .slice(0, 1000);

    return results;
  }

  async getSources(): Promise<NewsSource[]> {
    return this.scrapers.map(scraper => ({
      id: scraper.name.toLowerCase().replace(/\s+/g, '-'),
      name: scraper.name,
      url: scraper.url,
      enabled: true
    }));
  }

  getArticleCount(): number {
    return this.articles.length;
  }
}