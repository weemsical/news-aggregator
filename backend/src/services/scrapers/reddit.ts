import axios from 'axios';
import { Article, Scraper } from '../../types';

export class RedditScraper implements Scraper {
  name = 'Reddit';
  url = 'https://www.reddit.com/r/worldnews/hot.json';

  async scrape(): Promise<Article[]> {
    try {
      const response = await axios.get(this.url, {
        headers: {
          'User-Agent': 'news-aggregator-bot/1.0'
        },
        params: {
          limit: 25
        }
      });

      const posts = response.data.data.children;
      const articles: Article[] = [];

      for (const post of posts) {
        const data = post.data;

        // Skip stickied posts and self posts
        if (data.stickied || data.is_self) {
          continue;
        }

        // Skip if it's not a link to external content
        if (!data.url || data.url.includes('reddit.com')) {
          continue;
        }

        articles.push({
          id: `reddit-${data.id}`,
          title: data.title,
          url: data.url,
          source: 'Reddit',
          publishedAt: new Date(data.created_utc * 1000).toISOString(),
          description: data.selftext || `Posted in r/${data.subreddit}`,
          author: data.author,
          category: data.subreddit
        });
      }

      return articles;
    } catch (error) {
      console.error('Error scraping Reddit:', error);
      throw new Error(`Failed to scrape Reddit: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}