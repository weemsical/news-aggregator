import { useState, useEffect } from "react";
import { AnonymizedArticle } from "../types";
import { loadArticles } from "./articleData";
import { ArticleList } from "./ArticleList";
import { ArticleReader } from "./ArticleReader";
import { AuthProvider, useAuth } from "./AuthContext";
import { AuthForm } from "./AuthForm";
import "./App.css";

function AppContent() {
  const { user, loading: authLoading, logout } = useAuth();
  const [articles, setArticles] = useState<AnonymizedArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedArticleId, setSelectedArticleId] = useState<string | null>(null);
  const [showAuthForm, setShowAuthForm] = useState(false);

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
        <div className="app__header-top">
          <h1>I Call BullShit</h1>
          <div className="app__auth">
            {authLoading ? null : user ? (
              <>
                <span className="app__user-email">{user.email}</span>
                <button
                  className="app__auth-btn"
                  onClick={() => logout()}
                >
                  Log Out
                </button>
              </>
            ) : (
              <button
                className="app__auth-btn"
                onClick={() => setShowAuthForm(true)}
              >
                Log In
              </button>
            )}
          </div>
        </div>
        <p className="app__tagline">Read the news. Spot the spin.</p>
      </header>
      <main className="app__main">
        {loading ? (
          <p className="app__loading">Loading articles...</p>
        ) : selectedArticle ? (
          <ArticleReader
            article={selectedArticle}
            onBack={() => setSelectedArticleId(null)}
          />
        ) : (
          <ArticleList
            articles={articles}
            onSelectArticle={setSelectedArticleId}
          />
        )}
      </main>
      {showAuthForm && <AuthForm onClose={() => setShowAuthForm(false)} />}
    </div>
  );
}

export function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
