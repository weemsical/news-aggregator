import { useState, useEffect, useMemo } from "react";
import { AnonymizedArticle, LeaderboardEntry } from "../types";
import { loadArticles } from "./articleData";
import { fetchLeaderboard } from "./apiClient";
import { ArticleList } from "./ArticleList";
import { ArticleReader } from "./ArticleReader";
import { SourceLeaderboard } from "./SourceLeaderboard";
import { AdminPanel } from "./AdminPanel";
import { DateFilter } from "./DateFilter";
import { AuthProvider, useAuth } from "./AuthContext";
import { AuthForm } from "./AuthForm";
import "./App.css";

type View = "articles" | "leaderboard" | "admin";

function AppContent() {
  const { user, loading: authLoading, logout } = useAuth();
  const [articles, setArticles] = useState<AnonymizedArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedArticleId, setSelectedArticleId] = useState<string | null>(null);
  const [showAuthForm, setShowAuthForm] = useState(false);
  const [view, setView] = useState<View>("articles");
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const filteredArticles = useMemo(() => {
    const fromMs = fromDate ? new Date(fromDate).getTime() : 0;
    const toMs = toDate
      ? new Date(toDate).getTime() + 24 * 60 * 60 * 1000 - 1
      : Infinity;
    return articles.filter((a) => a.fetchedAt >= fromMs && a.fetchedAt <= toMs);
  }, [articles, fromDate, toDate]);

  const handleResetDates = () => {
    setFromDate("");
    setToDate("");
  };

  useEffect(() => {
    loadArticles().then((loaded) => {
      setArticles(loaded);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (view === "leaderboard") {
      fetchLeaderboard()
        .then(setLeaderboard)
        .catch(() => setLeaderboard([]));
    }
  }, [view]);

  const selectedArticle = selectedArticleId
    ? articles.find((a) => a.id === selectedArticleId)
    : undefined;

  const handleNavArticles = () => {
    setView("articles");
    setSelectedArticleId(null);
  };

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
        <nav className="app__nav">
          <button
            className={`app__nav-btn${view === "articles" ? " app__nav-btn--active" : ""}`}
            onClick={handleNavArticles}
          >
            Articles
          </button>
          <button
            className={`app__nav-btn${view === "leaderboard" ? " app__nav-btn--active" : ""}`}
            onClick={() => setView("leaderboard")}
          >
            Leaderboard
          </button>
          {user?.isAdmin && (
            <button
              className={`app__nav-btn${view === "admin" ? " app__nav-btn--active" : ""}`}
              onClick={() => setView("admin")}
            >
              Admin
            </button>
          )}
        </nav>
      </header>
      <main className="app__main">
        {view === "admin" ? (
          <AdminPanel />
        ) : view === "leaderboard" ? (
          <SourceLeaderboard entries={leaderboard} />
        ) : loading ? (
          <p className="app__loading">Loading articles...</p>
        ) : selectedArticle ? (
          <ArticleReader
            article={selectedArticle}
            onBack={() => setSelectedArticleId(null)}
          />
        ) : (
          <>
            <DateFilter
              fromDate={fromDate}
              toDate={toDate}
              onFromDateChange={setFromDate}
              onToDateChange={setToDate}
              onReset={handleResetDates}
              filteredCount={filteredArticles.length}
              totalCount={articles.length}
            />
            <ArticleList
              articles={filteredArticles}
              onSelectArticle={setSelectedArticleId}
            />
          </>
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
