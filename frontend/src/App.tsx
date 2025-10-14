import React, { useState, useEffect, useCallback } from 'react';
import './App.css';
import apiService, { Article, NewsSource } from './services/apiService';

function App() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [sources, setSources] = useState<NewsSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalArticles, setTotalArticles] = useState(0);
  const [selectedSource, setSelectedSource] = useState<string>('');
  const [isScrapingManually, setIsScrapingManually] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const ARTICLES_PER_PAGE = 20;

  const fetchArticles = useCallback(async (page = 1, source = '') => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await apiService.getArticles({
        page,
        limit: ARTICLES_PER_PAGE,
        source: source || undefined
      });
      
      setArticles(response.articles);
      setTotalArticles(response.total);
      setCurrentPage(response.page);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Failed to fetch articles:', err);
      setError(err instanceof Error ? err.message : 'Failed to load articles');
      setArticles([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchSources = useCallback(async () => {
    try {
      const sourcesData = await apiService.getSources();
      setSources(sourcesData);
    } catch (err) {
      console.error('Failed to fetch sources:', err);
    }
  }, []);

  const handleManualScraping = async () => {
    try {
      setIsScrapingManually(true);
      await apiService.triggerScraping();
      // Refresh articles after scraping
      await fetchArticles(1, selectedSource);
      setCurrentPage(1);
    } catch (err) {
      console.error('Manual scraping failed:', err);
      setError(err instanceof Error ? err.message : 'Scraping failed');
    } finally {
      setIsScrapingManually(false);
    }
  };

  const handleSourceChange = (source: string) => {
    setSelectedSource(source);
    setCurrentPage(1);
    fetchArticles(1, source);
  };

  const handlePageChange = (page: number) => {
    fetchArticles(page, selectedSource);
  };

  useEffect(() => {
    fetchSources();
    fetchArticles();
  }, [fetchArticles, fetchSources]);

  const totalPages = Math.ceil(totalArticles / ARTICLES_PER_PAGE);

  return (
    <div className="App">
      <header className="App-header">
        <h1>News Aggregator</h1>
        <p>Latest articles from multiple news sources</p>
        
        <div className="header-controls">
          <div className="source-filter">
            <label htmlFor="source-select">Filter by source:</label>
            <select 
              id="source-select"
              value={selectedSource} 
              onChange={(e) => handleSourceChange(e.target.value)}
              disabled={loading}
            >
              <option value="">All sources</option>
              {sources.map((source) => (
                <option key={source.id} value={source.name}>
                  {source.name}
                </option>
              ))}
            </select>
          </div>
          
          <button 
            onClick={handleManualScraping}
            disabled={isScrapingManually || loading}
            className="refresh-button"
          >
            {isScrapingManually ? 'Scraping...' : 'Refresh Articles'}
          </button>
        </div>
        
        {lastUpdated && (
          <p className="last-updated">
            Last updated: {lastUpdated.toLocaleTimeString()}
          </p>
        )}
      </header>

      <main>
        {error && (
          <div className="error-message">
            <p>⚠️ {error}</p>
            <button onClick={() => fetchArticles(currentPage, selectedSource)}>
              Try Again
            </button>
          </div>
        )}
        
        {loading ? (
          <div className="loading">
            <div className="spinner"></div>
            <p>Loading articles...</p>
          </div>
        ) : (
          <>
            {articles.length === 0 ? (
              <div className="empty-state">
                <h3>No articles available</h3>
                <p>
                  {selectedSource 
                    ? `No articles found for ${selectedSource}. Try selecting a different source or refresh articles.`
                    : 'No articles found. Try refreshing to fetch the latest news.'}
                </p>
                <button onClick={handleManualScraping} disabled={isScrapingManually}>
                  {isScrapingManually ? 'Scraping...' : 'Fetch Articles'}
                </button>
              </div>
            ) : (
              <>
                <div className="articles-info">
                  <p>
                    Showing {articles.length} of {totalArticles} articles
                    {selectedSource && ` from ${selectedSource}`}
                  </p>
                </div>
                
                <div className="articles">
                  {articles.map((article) => (
                    <article key={article.id} className="article-card">
                      <h3 className="article-title">{article.title}</h3>
                      
                      <p className="article-meta">
                        {new Date(article.publishedAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                      
                      {article.description && (
                        <p className="article-description">{article.description}</p>
                      )}
                      
                      <div className="article-actions">
                        <a 
                          href={article.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="read-more-link"
                        >
                          Read full article →
                        </a>
                      </div>
                    </article>
                  ))}
                </div>
                
                {totalPages > 1 && (
                  <div className="pagination">
                    <button 
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage <= 1 || loading}
                      className="pagination-button"
                    >
                      ← Previous
                    </button>
                    
                    <span className="pagination-info">
                      Page {currentPage} of {totalPages}
                    </span>
                    
                    <button 
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage >= totalPages || loading}
                      className="pagination-button"
                    >
                      Next →
                    </button>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </main>
    </div>
  );
}

export default App;
