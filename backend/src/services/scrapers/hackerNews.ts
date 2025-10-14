import axios from 'axios';
import { Article, Scraper } from '../../types';

export class HackerNewsScraper implements Scraper {
  name = 'Hacker News';
  url = 'https://hacker-news.firebaseio.com/v0';

  async scrape(): Promise<Article[]> {
    try {
      // Get top stories IDs
      const topStoriesResponse = await axios.get(`${this.url}/topstories.json`);
      const topStoryIds: number[] = topStoriesResponse.data.slice(0, 30); // Get top 30

      // Fetch details for each story
      const articles: Article[] = [];
      
      for (const id of topStoryIds) {
        try {
          const storyResponse = await axios.get(`${this.url}/item/${id}.json`);
          const story = storyResponse.data;

          // Skip if not a story or if it doesn't have a URL
          if (story.type !== 'story' || !story.url) {
            continue;
          }

          articles.push({
            id: `hn-${story.id}`,
            title: story.title,
            url: story.url,
            source: 'Hacker News',
            publishedAt: new Date(story.time * 1000).toISOString(),
            description: story.text,
            author: story.by
          });

        } catch (error) {
          console.error(`Error fetching HN story ${id}:`, error);
          continue;
        }
      }

      return articles;
    } catch (error) {
      console.error('Error scraping Hacker News:', error);
      throw new Error(`Failed to scrape Hacker News: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}