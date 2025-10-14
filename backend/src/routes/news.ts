import { Router } from 'express';
import { NewsService } from '../services/newsService';
import { APIResponse, ArticlesResponse } from '../types';

export const newsRouter = Router();
const newsService = new NewsService();

// Get all articles with pagination
newsRouter.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
    const source = req.query.source as string;
    
    const result = await newsService.getArticles({ page, limit, source });
    
    const response: APIResponse<ArticlesResponse> = {
      success: true,
      data: result,
      timestamp: new Date().toISOString()
    };
    
    res.json(response);
  } catch (error) {
    const response: APIResponse<ArticlesResponse> = {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      timestamp: new Date().toISOString()
    };
    
    res.status(500).json(response);
  }
});

// Trigger manual scraping
newsRouter.post('/scrape', async (req, res) => {
  try {
    const results = await newsService.scrapeAllSources();
    
    const response: APIResponse<any> = {
      success: true,
      data: {
        message: 'Scraping completed',
        results
      },
      timestamp: new Date().toISOString()
    };
    
    res.json(response);
  } catch (error) {
    const response: APIResponse<any> = {
      success: false,
      error: error instanceof Error ? error.message : 'Scraping failed',
      timestamp: new Date().toISOString()
    };
    
    res.status(500).json(response);
  }
});

// Get available news sources
newsRouter.get('/sources', async (req, res) => {
  try {
    const sources = await newsService.getSources();
    
    const response: APIResponse<any> = {
      success: true,
      data: { sources },
      timestamp: new Date().toISOString()
    };
    
    res.json(response);
  } catch (error) {
    const response: APIResponse<any> = {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get sources',
      timestamp: new Date().toISOString()
    };
    
    res.status(500).json(response);
  }
});