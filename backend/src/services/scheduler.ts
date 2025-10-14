import * as cron from 'node-cron';
import { NewsService } from './newsService';

const newsService = new NewsService();

export function startNewsScheduler() {
  console.log('Starting news scraping scheduler...');

  // Run initial scrape
  scrapeNews();

  // Schedule scraping every 30 minutes
  cron.schedule('*/30 * * * *', () => {
    console.log('Running scheduled news scraping...');
    scrapeNews();
  });

  console.log('News scheduler started - scraping every 30 minutes');
}

async function scrapeNews() {
  try {
    const results = await newsService.scrapeAllSources();
    const totalArticles = results.reduce((sum, result) => sum + result.articlesFound, 0);
    
    console.log(`Scraping completed: ${totalArticles} new articles found`);
    console.log(`Current total articles: ${newsService.getArticleCount()}`);
  } catch (error) {
    console.error('Scheduled scraping failed:', error);
  }
}