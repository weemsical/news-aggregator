export interface Article {
  id: string;
  title: string;
  url: string;
  source: string;
  publishedAt: string;
  description?: string;
  imageUrl?: string;
  author?: string;
  category?: string;
}

export interface NewsSource {
  id: string;
  name: string;
  url: string;
  enabled: boolean;
  lastScraped?: string;
}

export interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
}

export interface ArticlesResponse {
  articles: Article[];
  total: number;
  page: number;
  limit: number;
}

export interface ScrapingResult {
  source: string;
  articlesFound: number;
  errors?: string[];
  duration: number;
}

export interface ScrapingConfig {
  userAgent: string;
  timeout: number;
  maxRetries: number;
  delay: number;
}

export interface Scraper {
  name: string;
  url: string;
  scrape(): Promise<Article[]>;
}

export interface ScrapingJobConfig {
  intervalMinutes: number;
  enabled: boolean;
}
