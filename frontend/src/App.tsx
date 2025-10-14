import React from 'react';
import './App.css';

interface Article {
  id: string;
  title: string;
  url: string;
  source: string;
  publishedAt: string;
  description?: string;
}

function App() {
  const [articles, setArticles] = React.useState<Article[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    // TODO: Fetch articles from backend API
    setLoading(false);
  }, []);

  return (
    <div className="App">
      <header className="App-header">
        <h1>News Aggregator</h1>
        <p>Top articles from various news sites</p>
      </header>
      <main>
        {loading ? (
          <div className="loading">Loading articles...</div>
        ) : (
          <div className="articles">
            {articles.length === 0 ? (
              <p>No articles available. Backend API not yet implemented.</p>
            ) : (
              articles.map((article) => (
                <div key={article.id} className="article-card">
                  <h3>{article.title}</h3>
                  <p className="article-meta">
                    {new Date(article.publishedAt).toLocaleDateString()}
                  </p>
                  {article.description && (
                    <p className="article-description">{article.description}</p>
                  )}
                  <a href={article.url} target="_blank" rel="noopener noreferrer">
                    Read more
                  </a>
                </div>
              ))
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export default App;