import axios from 'axios';
import * as cheerio from 'cheerio';
import { Article, Scraper } from '../../types';

export class FoxNewsScraper implements Scraper {
  name = 'Fox News';
  url = 'https://www.foxnews.com';

  async scrape(): Promise<Article[]> {
    try {
      const response = await axios.get(this.url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        },
        timeout: 10000
      });

      const $ = cheerio.load(response.data);
      const articles: Article[] = [];
      const seenUrls = new Set<string>();

      // Fox News uses various selectors for articles
      const articleSelectors = [
        'article',
        '.collection-article-list article',
        '.story-headline',
        'h2 a',
        'h3 a',
        '.title a',
        'a[href*="/politics/"]',
        'a[href*="/us/"]',
        'a[href*="/world/"]',
        'a[href*="/business/"]'
      ];

      for (const selector of articleSelectors) {
        $(selector).each((index, element) => {
          try {
            let title = '';
            let url = '';
            let description = '';

            if (selector === 'article') {
              const $article = $(element);
              const $link = $article.find('a[href*="/"]').first();
              const $headline = $article.find('h2, h3, .headline, .title').first();
              
              title = $headline.text().trim() || $link.text().trim();
              url = $link.attr('href') || '';
              description = $article.find('p, .summary, .dek').first().text().trim();
            } else if (selector.includes('story-headline')) {
              const $el = $(element);
              const $link = $el.find('a').first();
              title = $link.text().trim();
              url = $link.attr('href') || '';
            } else if (selector.includes('h2 a') || selector.includes('h3 a') || selector.includes('.title a')) {
              const $el = $(element);
              title = $el.text().trim();
              url = $el.attr('href') || '';
              description = $el.closest('article, .story, .item').find('p').first().text().trim();
            } else {
              const $el = $(element);
              title = $el.text().trim();
              url = $el.attr('href') || '';
              description = $el.closest('article, .story, .item').find('p').first().text().trim();
            }

            // Clean up the URL
            if (url.startsWith('/')) {
              url = `https://www.foxnews.com${url}`;
            }

            // Skip if we don't have essential data or if we've seen this URL
            if (!title || !url || !url.includes('foxnews.com') || seenUrls.has(url)) {
              return;
            }

            // Skip non-article URLs
            if (url.includes('/video/') || url.includes('/gallery/') || url.includes('/live-news/') || 
                url.includes('/category/') || url.includes('/shows/') || url.includes('#')) {
              return;
            }

            // Skip if title is too short (likely not a real article)
            if (title.length < 10) {
              return;
            }

            seenUrls.add(url);

            // Generate a simple ID from the URL
            const urlParts = url.split('/');
            const id = urlParts[urlParts.length - 1] || urlParts[urlParts.length - 2] || `fox-${Date.now()}-${index}`;

            articles.push({
              id: `fox-${id}`,
              title: title.substring(0, 200), // Limit title length
              url,
              source: 'Fox News',
              publishedAt: new Date().toISOString(), // Fox News doesn't easily expose publish dates
              description: description.substring(0, 300), // Limit description length
              category: 'news'
            });

          } catch (elementError) {
            // Skip this element if there's an error processing it
            console.warn(`Error processing Fox News article element:`, elementError);
          }
        });
      }

      // Remove duplicates and limit to top 20
      const uniqueArticles = Array.from(
        new Map(articles.map(article => [article.url, article])).values()
      ).slice(0, 20);

      return uniqueArticles;

    } catch (error) {
      console.error('Error scraping Fox News:', error);
      throw new Error(`Failed to scrape Fox News: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}