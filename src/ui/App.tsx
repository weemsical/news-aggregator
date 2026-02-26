import { useState, useEffect } from "react";
import { AnonymizedArticle } from "../types";
import { FlagStore } from "../services/FlagStore";
import { loadArticles } from "./articleData";
import { ArticleList } from "./ArticleList";
import { ArticleReader } from "./ArticleReader";
import "./App.css";

export function App() {
  const [articles, setArticles] = useState<AnonymizedArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedArticleId, setSelectedArticleId] = useState<string | null>(null);
  const [flagStore] = useState(() => new FlagStore());

  useEffect(() => {
    loadArticles().then((loaded) => {
      setArticles(loaded);
      setLoading(false);
    });
  }, []);

  const selectedArticle = selectedArticleId
    ? articles.find((a) => a.id === selectedArticleId)
    : undefined;

  return (
    <div className="app">
      <header className="app__header">
        <h1>I Call BullShit</h1>
        <p className="app__tagline">Read the news. Spot the spin.</p>
      </header>
      <main className="app__main">
        {loading ? (
          <p className="app__loading">Loading articles...</p>
        ) : selectedArticle ? (
          <ArticleReader
            article={selectedArticle}
            onBack={() => setSelectedArticleId(null)}
            flagStore={flagStore}
          />
        ) : (
          <ArticleList
            articles={articles}
            onSelectArticle={setSelectedArticleId}
          />
        )}
      </main>
    </div>
  );
}
