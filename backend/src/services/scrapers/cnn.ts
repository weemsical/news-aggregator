import axios from 'axios';
import * as cheerio from 'cheerio';
import { Article, Scraper } from '../../types';

export class CNNScraper implements Scraper {
  name = 'CNN';
  url = 'https://www.cnn.com';

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

      // CNN uses various selectors for articles, we'll try multiple approaches
      const articleSelectors = [
        'article[data-module-name*="headline"]',
        'article[data-module-name*="card"]',
        '.cd__content',
        '.container_lead-plus-headlines__link-title',
        'a[data-link-type="article"]'
      ];

      for (const selector of articleSelectors) {
        $(selector).each((index, element) => {
          try {
            let title = '';
            let url = '';
            let description = '';

            if (selector.includes('article')) {
              const $article = $(element);
              const $link = $article.find('a').first();
              const $headline = $article.find('h3, .cd__headline-text, [data-module-name*="headline"] span').first();
              
              title = $headline.text().trim() || $link.text().trim();
              url = $link.attr('href') || '';
              description = $article.find('p, .cd__description').first().text().trim();
            } else if (selector.includes('container_lead-plus-headlines')) {
              const $el = $(element);
              title = $el.text().trim();
              url = $el.attr('href') || '';
            } else {
              const $el = $(element);
              title = $el.text().trim() || $el.find('span, h3, h2').first().text().trim();
              url = $el.attr('href') || '';
              description = $el.find('p').first().text().trim();
            }

            // Clean up the URL
            if (url.startsWith('/')) {
              url = `https://www.cnn.com${url}`;
            }

            // Skip if we don't have essential data or if we've seen this URL
            if (!title || !url || !url.includes('cnn.com') || seenUrls.has(url)) {
              return;
            }

            // Skip non-article URLs
            if (url.includes('/videos/') || url.includes('/gallery/') || url.includes('/live-news/')) {
              return;
            }

            seenUrls.add(url);

            // Generate a simple ID from the URL
            const urlParts = url.split('/');
            const id = urlParts[urlParts.length - 1] || urlParts[urlParts.length - 2] || `cnn-${Date.now()}-${index}`;

            articles.push({
              id: `cnn-${id}`,
              title: title.substring(0, 200), // Limit title length
              url,
              source: 'CNN',
              publishedAt: new Date().toISOString(), // CNN doesn't easily expose publish dates
              description: description.substring(0, 300), // Limit description length
              category: 'news'
            });

          } catch (elementError) {
            // Skip this element if there's an error processing it
            console.warn(`Error processing CNN article element:`, elementError);
          }
        });
      }

      // Remove duplicates and limit to top 20
      const uniqueArticles = Array.from(
        new Map(articles.map(article => [article.url, article])).values()
      ).slice(0, 20);

      return uniqueArticles;

    } catch (error) {
      console.error('Error scraping CNN:', error);
      throw new Error(`Failed to scrape CNN: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}