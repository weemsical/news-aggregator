import React, { useState, useEffect, useCallback, useMemo } from 'react';
import './App.css';
import apiService, { Article, NewsSource } from './services/apiService';

function App() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isScrapingManually, setIsScrapingManually] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set());

  const fetchArticles = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await apiService.getArticles({
        page: 1,
        limit: 100 // Get more articles for better categorization
      });
      
      setArticles(response.articles);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Failed to fetch articles:', err);
      setError(err instanceof Error ? err.message : 'Failed to load articles');
      setArticles([]);
    } finally {
      setLoading(false);
    }
  }, []);


  const handleManualScraping = async () => {
    try {
      setIsScrapingManually(true);
      await apiService.triggerScraping();
      // Refresh articles after scraping
      await fetchArticles();
    } catch (err) {
      console.error('Manual scraping failed:', err);
      setError(err instanceof Error ? err.message : 'Scraping failed');
    } finally {
      setIsScrapingManually(false);
    }
  };

  const toggleCategory = (category: string) => {
    const newSelectedCategories = new Set(selectedCategories);
    if (newSelectedCategories.has(category)) {
      newSelectedCategories.delete(category);
    } else {
      newSelectedCategories.add(category);
    }
    setSelectedCategories(newSelectedCategories);
  };

  useEffect(() => {
    fetchArticles();
  }, [fetchArticles]);

  // Group articles by category
  const groupedArticles = useMemo(() => {
    const groups: { [key: string]: Article[] } = {};
    
    articles.forEach(article => {
      const category = article.category || 'uncategorized';
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(article);
    });
    
    // Sort articles within each category by date
    Object.keys(groups).forEach(category => {
      groups[category].sort((a, b) => 
        new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
      );
    });
    
    return groups;
  }, [articles]);

  // Get available categories
  const availableCategories = useMemo(() => {
    return Object.keys(groupedArticles).sort();
  }, [groupedArticles]);

  // Filter categories based on selection
  const displayedCategories = useMemo(() => {
    if (selectedCategories.size === 0) {
      return availableCategories; // Show all if none selected
    }
    return availableCategories.filter(cat => selectedCategories.has(cat));
  }, [availableCategories, selectedCategories]);

  return (
    <div className="App">
      <header className="App-header">
        <h1>News Aggregator</h1>
        <p>Latest articles from multiple news sources</p>
        
        <div className="header-controls">
          <div className="category-filters">
            <label>Show categories:</label>
            <div className="category-checkboxes">
              {availableCategories.map((category) => (
                <label key={category} className="category-checkbox">
                  <input
                    type="checkbox"
                    checked={selectedCategories.size === 0 || selectedCategories.has(category)}
                    onChange={() => toggleCategory(category)}
                    disabled={loading}
                  />
                  <span className="category-name">{category}</span>
                </label>
              ))}
            </div>
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
            <button onClick={() => fetchArticles()}>
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
                <p>No articles found. Try refreshing to fetch the latest news.</p>
                <button onClick={handleManualScraping} disabled={isScrapingManually}>
                  {isScrapingManually ? 'Scraping...' : 'Fetch Articles'}
                </button>
              </div>
            ) : (
              <>
                <div className="articles-info">
                  <p>Showing {articles.length} articles organized by category</p>
                </div>
                
                <div className="categories-container">
                  {displayedCategories.map((category) => (
                    <div key={category} className="category-section">
                      <h2 className="category-title">
                        {category.charAt(0).toUpperCase() + category.slice(1)}
                        <span className="category-count">({groupedArticles[category].length})</span>
                      </h2>
                      
                      <div className="articles">
                        {groupedArticles[category].map((article) => (
                          <article key={article.id} className="article-card">
                            <h3 className="article-title">{article.title}</h3>
                            
                            <p className="article-meta">
                              <span className="article-source">{article.source}</span> • {new Date(article.publishedAt).toLocaleDateString('en-US', {
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
                    </div>
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </main>
    </div>
  );
}

export default App;
