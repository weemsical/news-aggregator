const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

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

class ApiService {
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<APIResponse<T>> {
    const url = `${API_BASE_URL}${endpoint}`;
    
    try {
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error(`API request failed for ${endpoint}:`, error);
      throw error;
    }
  }

  async getArticles(params: {
    page?: number;
    limit?: number;
    source?: string;
  } = {}): Promise<ArticlesResponse> {
    const searchParams = new URLSearchParams();
    
    if (params.page) searchParams.append('page', params.page.toString());
    if (params.limit) searchParams.append('limit', params.limit.toString());
    if (params.source) searchParams.append('source', params.source);

    const query = searchParams.toString();
    const endpoint = `/api/news${query ? `?${query}` : ''}`;
    
    const response = await this.request<ArticlesResponse>(endpoint);
    
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to fetch articles');
    }
    
    return response.data;
  }

  async getSources(): Promise<NewsSource[]> {
    const response = await this.request<{ sources: NewsSource[] }>('/api/news/sources');
    
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to fetch sources');
    }
    
    return response.data.sources;
  }

  async triggerScraping(): Promise<ScrapingResult[]> {
    const response = await this.request<{ message: string; results: ScrapingResult[] }>(
      '/api/news/scrape',
      { method: 'POST' }
    );
    
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to trigger scraping');
    }
    
    return response.data.results;
  }

  async checkHealth(): Promise<{ status: string; timestamp: string }> {
    const response = await this.request<{ status: string; timestamp: string }>('/health');
    
    if (!response.success || !response.data) {
      throw new Error('Health check failed');
    }
    
    return response.data;
  }
}

export const apiService = new ApiService();
export default apiService;