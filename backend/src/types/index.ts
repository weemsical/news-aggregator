export * from '../../../shared/types';

export interface ScrapingConfig {
  userAgent: string;
  timeout: number;
  maxRetries: number;
  delay: number;
}

export interface Scraper {
  name: string;
  url: string;
  scrape(): Promise<import('../../../shared/types').Article[]>;
}

export interface ScrapingJobConfig {
  intervalMinutes: number;
  enabled: boolean;
}