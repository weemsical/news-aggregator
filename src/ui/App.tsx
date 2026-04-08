import { useState, useEffect } from "react";
import { AnonymizedArticle } from "@types";
import { loadArticles } from "./articleData";
import { ArticleList } from "./ArticleList";
import { ArticleReader } from "./ArticleReader";
import { ScoresPage } from "./ScoresPage";
import { AdminPanel } from "./AdminPanel";
import { HowItWorks } from "./HowItWorks";
import { DateFilter } from "./DateFilter";
import { AuthProvider, useAuth } from "./AuthContext";
import { AuthForm } from "./AuthForm";
import "./App.css";

type View = "articles" | "scores" | "how-it-works" | "admin";

function AppContent() {
  const { user, loading: authLoading, logout } = useAuth();
  const [articles, setArticles] = useState<AnonymizedArticle[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedArticleId, setSelectedArticleId] = useState<string | null>(null);
  const [showAuthForm, setShowAuthForm] = useState(false);
  const [view, setView] = useState<View>("articles");
  const [sort, setSort] = useState("date");
  const [page, setPage] = useState(1);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  useEffect(() => {
    setLoading(true);
    loadArticles({ sort, page }).then((response) => {
      setArticles(response.articles);
      setTotal(response.total);
      setLoading(false);
    });
  }, [sort, page]);

  const filteredArticles = (() => {
    const fromMs = fromDate ? new Date(fromDate).getTime() : 0;
    const toMs = toDate
      ? new Date(toDate).getTime() + 24 * 60 * 60 * 1000 - 1
      : Infinity;
    return articles.filter((a) => a.fetchedAt >= fromMs && a.fetchedAt <= toMs);
  })();

  const handleResetDates = () => {
    setFromDate("");
    setToDate("");
  };

  const handleSortChange = (newSort: string) => {
    setSort(newSort);
    setPage(1);
  };

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
            className={`app__nav-btn${view === "scores" ? " app__nav-btn--active" : ""}`}
            onClick={() => setView("scores")}
          >
            Scores
          </button>
          <button
            className={`app__nav-btn${view === "how-it-works" ? " app__nav-btn--active" : ""}`}
            onClick={() => setView("how-it-works")}
          >
            How It Works
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
        ) : view === "how-it-works" ? (
          <HowItWorks />
        ) : view === "scores" ? (
          <ScoresPage />
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
              totalCount={total}
            />
            <ArticleList
              articles={filteredArticles}
              onSelectArticle={setSelectedArticleId}
              sort={sort}
              onSortChange={handleSortChange}
              page={page}
              total={total}
              pageSize={20}
              onPageChange={setPage}
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
