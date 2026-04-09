import { useState, useEffect } from "react";
import {
  AdminFeedSource,
  AdminUser,
  FetchNowResult,
  ReplacementRuleData,
  ReviewArticle,
  fetchAdminFeedSources,
  addFeedSource,
  deleteFeedSource,
  fetchNow,
  updateFeedSource,
  fetchAdmins,
  addAdminByEmail,
  removeAdmin,
  fetchReplacementRules,
  createReplacementRule,
  deleteReplacementRule,
  fetchReviewQueue,
  approveArticle,
  rejectArticle,
  refreshAllFeeds,
} from "./apiClient";
import "./AdminPanel.css";

type SidebarView = "feeds" | "review-queue" | "admins";

export function AdminPanel() {
  const [sidebarView, setSidebarView] = useState<SidebarView>("feeds");
  const [sources, setSources] = useState<AdminFeedSource[]>([]);
  const [selectedSourceId, setSelectedSourceId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadSources();
  }, []);

  async function loadSources() {
    try {
      const data = await fetchAdminFeedSources();
      setSources(data);
      setError("");
    } catch {
      setError("Failed to load feed sources");
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <p className="admin-panel__loading">Loading admin dashboard...</p>;
  }

  return (
    <div className="admin-dashboard">
      <nav className="admin-dashboard__sidebar">
        <h3 className="admin-dashboard__sidebar-title">Admin</h3>
        <button
          className={`admin-dashboard__sidebar-btn${sidebarView === "feeds" && !selectedSourceId ? " admin-dashboard__sidebar-btn--active" : ""}`}
          onClick={() => { setSidebarView("feeds"); setSelectedSourceId(null); }}
        >
          Feed Sources
        </button>
        {sources.map((s) => (
          <button
            key={s.sourceId}
            className={`admin-dashboard__sidebar-feed${selectedSourceId === s.sourceId ? " admin-dashboard__sidebar-feed--active" : ""}`}
            onClick={() => { setSidebarView("feeds"); setSelectedSourceId(s.sourceId); }}
          >
            {s.name}
          </button>
        ))}
        <button
          className={`admin-dashboard__sidebar-btn${sidebarView === "review-queue" ? " admin-dashboard__sidebar-btn--active" : ""}`}
          onClick={() => { setSidebarView("review-queue"); setSelectedSourceId(null); }}
        >
          Review Queue
        </button>
        <button
          className={`admin-dashboard__sidebar-btn${sidebarView === "admins" ? " admin-dashboard__sidebar-btn--active" : ""}`}
          onClick={() => { setSidebarView("admins"); setSelectedSourceId(null); }}
        >
          Manage Admins
        </button>
      </nav>
      <main className="admin-dashboard__content">
        {error && <p className="admin-panel__error">{error}</p>}
        {sidebarView === "feeds" && !selectedSourceId && (
          <FeedSourcesPanel sources={sources} onReload={loadSources} />
        )}
        {sidebarView === "feeds" && selectedSourceId && (
          <FeedDetailPanel
            source={sources.find((s) => s.sourceId === selectedSourceId)!}
            onReload={loadSources}
          />
        )}
        {sidebarView === "review-queue" && <ReviewQueuePanel />}
        {sidebarView === "admins" && <AdminsPanel />}
      </main>
    </div>
  );
}

function FeedSourcesPanel({ sources, onReload }: { sources: AdminFeedSource[]; onReload: () => Promise<void> }) {
  const [sourceId, setSourceId] = useState("");
  const [name, setName] = useState("");
  const [feedUrl, setFeedUrl] = useState("");
  const [defaultTags, setDefaultTags] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [addError, setAddError] = useState("");
  const [fetchResults, setFetchResults] = useState<Record<string, FetchNowResult | string>>({});
  const [fetchAllResult, setFetchAllResult] = useState<FetchNowResult | string | null>(null);
  const [fetchingAll, setFetchingAll] = useState(false);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setAddError("");
    setSubmitting(true);
    try {
      const tags = defaultTags.split(",").map((t) => t.trim()).filter(Boolean);
      await addFeedSource({
        sourceId: sourceId.trim(),
        name: name.trim(),
        feedUrl: feedUrl.trim(),
        defaultTags: tags,
      });
      setSourceId("");
      setName("");
      setFeedUrl("");
      setDefaultTags("");
      await onReload();
    } catch (err: any) {
      setAddError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(sid: string) {
    try {
      await deleteFeedSource(sid);
      await onReload();
    } catch {
      // silent
    }
  }

  async function handleFetchAll() {
    setFetchingAll(true);
    setFetchAllResult(null);
    try {
      const result = await refreshAllFeeds();
      setFetchAllResult(result);
    } catch (err: any) {
      setFetchAllResult(err.message);
    } finally {
      setFetchingAll(false);
    }
  }

  async function handleFetchNow(sid: string) {
    setFetchResults((prev) => ({ ...prev, [sid]: "fetching" }));
    try {
      const result = await fetchNow(sid);
      setFetchResults((prev) => ({ ...prev, [sid]: result }));
    } catch (err: any) {
      setFetchResults((prev) => ({ ...prev, [sid]: err.message }));
    }
  }

  return (
    <>
      <h2 className="admin-panel__title">Manage Feed Sources</h2>
      <form className="admin-panel__form" onSubmit={handleAdd}>
        <h3 className="admin-panel__form-title">Add New Source</h3>
        <div className="admin-panel__field">
          <label htmlFor="sourceId">Source ID</label>
          <input id="sourceId" type="text" value={sourceId} onChange={(e) => setSourceId(e.target.value)} placeholder="e.g. daily-wire" required />
        </div>
        <div className="admin-panel__field">
          <label htmlFor="name">Display Name</label>
          <input id="name" type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. The Daily Wire" required />
        </div>
        <div className="admin-panel__field">
          <label htmlFor="feedUrl">Feed URL</label>
          <input id="feedUrl" type="url" value={feedUrl} onChange={(e) => setFeedUrl(e.target.value)} placeholder="https://example.com/feed.xml" required />
        </div>
        <div className="admin-panel__field">
          <label htmlFor="defaultTags">Tags (comma-separated)</label>
          <input id="defaultTags" type="text" value={defaultTags} onChange={(e) => setDefaultTags(e.target.value)} placeholder="e.g. politics, conservative" />
        </div>
        {addError && <p className="admin-panel__error">{addError}</p>}
        <button type="submit" className="admin-panel__submit" disabled={submitting}>
          {submitting ? "Adding..." : "Add Source"}
        </button>
      </form>

      <div className="admin-panel__fetch-all">
        <button
          className="admin-panel__fetch-btn"
          onClick={handleFetchAll}
          disabled={fetchingAll}
        >
          {fetchingAll ? "Fetching..." : "Fetch All Feeds"}
        </button>
        {fetchAllResult && typeof fetchAllResult === "string" && (
          <span className="admin-panel__fetch-error">{fetchAllResult}</span>
        )}
        {fetchAllResult && typeof fetchAllResult !== "string" && (
          <span className="admin-panel__fetch-success">
            Found {fetchAllResult.articlesFound} articles, saved {fetchAllResult.newArticlesSaved} new
          </span>
        )}
      </div>

      <h3 className="admin-panel__list-title">Current Sources ({sources.length})</h3>
      <ul className="admin-panel__list">
        {sources.map((source) => (
          <li key={source.sourceId} className="admin-panel__source">
            <div className="admin-panel__source-info">
              <span className="admin-panel__source-name">{source.name}</span>
              <span className="admin-panel__source-id">{source.sourceId}</span>
              {source.isDynamic && <span className="admin-panel__badge">custom</span>}
              <span className="admin-panel__badge admin-panel__badge--mode">
                {source.publishMode === "manual" ? "manual" : "auto"}
              </span>
            </div>
            <div className="admin-panel__source-actions">
              <button className="admin-panel__fetch-btn" onClick={() => handleFetchNow(source.sourceId)} disabled={fetchResults[source.sourceId] === "fetching"}>
                {fetchResults[source.sourceId] === "fetching" ? "Fetching..." : "Fetch Now"}
              </button>
              {source.isDynamic && (
                <button className="admin-panel__delete-btn" onClick={() => handleDelete(source.sourceId)}>Delete</button>
              )}
            </div>
            {fetchResults[source.sourceId] && fetchResults[source.sourceId] !== "fetching" && (
              <div className="admin-panel__fetch-result">
                {typeof fetchResults[source.sourceId] === "string" ? (
                  <span className="admin-panel__fetch-error">{fetchResults[source.sourceId] as string}</span>
                ) : (
                  <span className="admin-panel__fetch-success">
                    Found {(fetchResults[source.sourceId] as FetchNowResult).articlesFound} articles, saved {(fetchResults[source.sourceId] as FetchNowResult).newArticlesSaved} new
                  </span>
                )}
              </div>
            )}
          </li>
        ))}
      </ul>
    </>
  );
}

function FeedDetailPanel({ source, onReload }: { source: AdminFeedSource; onReload: () => Promise<void> }) {
  const [rules, setRules] = useState<ReplacementRuleData[]>([]);
  const [rulesLoading, setRulesLoading] = useState(true);
  const [pattern, setPattern] = useState("");
  const [replacementText, setReplacementText] = useState("");
  const [isRegex, setIsRegex] = useState(false);
  const [ruleError, setRuleError] = useState("");
  const [toggling, setToggling] = useState(false);

  useEffect(() => {
    loadRules();
  }, [source.sourceId]);

  async function loadRules() {
    setRulesLoading(true);
    try {
      const data = await fetchReplacementRules(source.sourceId);
      setRules(data);
    } catch {
      // silent
    } finally {
      setRulesLoading(false);
    }
  }

  async function handleToggleMode() {
    setToggling(true);
    try {
      const newMode = source.publishMode === "manual" ? "auto" : "manual";
      await updateFeedSource(source.sourceId, { publishMode: newMode });
      await onReload();
    } catch {
      // silent
    } finally {
      setToggling(false);
    }
  }

  async function handleAddRule(e: React.FormEvent) {
    e.preventDefault();
    setRuleError("");
    try {
      await createReplacementRule(source.sourceId, { pattern, replacementText, isRegex });
      setPattern("");
      setReplacementText("");
      setIsRegex(false);
      await loadRules();
    } catch (err: any) {
      setRuleError(err.message);
    }
  }

  async function handleDeleteRule(ruleId: string) {
    try {
      await deleteReplacementRule(ruleId);
      await loadRules();
    } catch {
      // silent
    }
  }

  return (
    <>
      <h2 className="admin-panel__title">{source.name}</h2>
      <div className="admin-panel__detail-section">
        <p><strong>Source ID:</strong> {source.sourceId}</p>
        <p><strong>Feed URL:</strong> {source.feedUrl}</p>
        <p>
          <strong>Publish Mode:</strong> {source.publishMode === "manual" ? "Manual Review" : "Auto-publish"}
          <button
            className="admin-panel__toggle-btn"
            onClick={handleToggleMode}
            disabled={toggling}
          >
            Switch to {source.publishMode === "manual" ? "Auto" : "Manual"}
          </button>
        </p>
      </div>

      <h3 className="admin-panel__list-title">Replacement Rules ({rules.length})</h3>
      {rulesLoading ? (
        <p>Loading rules...</p>
      ) : (
        <>
          <form className="admin-panel__form" onSubmit={handleAddRule}>
            <div className="admin-panel__field">
              <label htmlFor="rulePattern">Pattern</label>
              <input id="rulePattern" type="text" value={pattern} onChange={(e) => setPattern(e.target.value)} placeholder="e.g. libtard" required />
            </div>
            <div className="admin-panel__field">
              <label htmlFor="ruleReplacement">Replacement Text</label>
              <input id="ruleReplacement" type="text" value={replacementText} onChange={(e) => setReplacementText(e.target.value)} placeholder="e.g. [removed]" required />
            </div>
            <div className="admin-panel__field admin-panel__field--checkbox">
              <label>
                <input type="checkbox" checked={isRegex} onChange={(e) => setIsRegex(e.target.checked)} />
                {" "}Use as regex
              </label>
            </div>
            {ruleError && <p className="admin-panel__error">{ruleError}</p>}
            <button type="submit" className="admin-panel__submit">Add Rule</button>
          </form>

          <ul className="admin-panel__list">
            {rules.map((rule) => (
              <li key={rule.id} className="admin-panel__source">
                <div className="admin-panel__source-info">
                  <span className="admin-panel__source-name">
                    {rule.isRegex ? `/${rule.pattern}/` : rule.pattern}
                  </span>
                  <span className="admin-panel__source-id">
                    &rarr; {rule.replacementText}
                  </span>
                  {rule.isRegex && <span className="admin-panel__badge">regex</span>}
                </div>
                <div className="admin-panel__source-actions">
                  <button className="admin-panel__delete-btn" onClick={() => handleDeleteRule(rule.id)}>Delete</button>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
    </>
  );
}

function ReviewQueuePanel() {
  const [articles, setArticles] = useState<ReviewArticle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadQueue();
  }, []);

  async function loadQueue() {
    setLoading(true);
    try {
      const data = await fetchReviewQueue();
      setArticles(data);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }

  async function handleApprove(id: string) {
    try {
      await approveArticle(id);
      await loadQueue();
    } catch {
      // silent
    }
  }

  async function handleReject(id: string) {
    try {
      await rejectArticle(id);
      await loadQueue();
    } catch {
      // silent
    }
  }

  if (loading) return <p className="admin-panel__loading">Loading review queue...</p>;

  return (
    <>
      <h2 className="admin-panel__title">Review Queue ({articles.length})</h2>
      {articles.length === 0 ? (
        <p>No articles pending review.</p>
      ) : (
        <ul className="admin-panel__list">
          {articles.map((article) => (
            <li key={article.id} className="admin-panel__source admin-panel__review-card">
              <h4 className="admin-panel__review-title">{article.title}</h4>
              <div className="admin-panel__review-body">
                {article.body.slice(0, 3).map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
                {article.body.length > 3 && <p className="admin-panel__review-more">...and {article.body.length - 3} more paragraphs</p>}
              </div>
              <div className="admin-panel__source-actions">
                <button className="admin-panel__approve-btn" onClick={() => handleApprove(article.id)}>Approve</button>
                <button className="admin-panel__delete-btn" onClick={() => handleReject(article.id)}>Reject</button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

function AdminsPanel() {
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [adminEmail, setAdminEmail] = useState("");
  const [adminSubmitting, setAdminSubmitting] = useState(false);
  const [adminError, setAdminError] = useState("");

  useEffect(() => {
    loadAdmins();
  }, []);

  async function loadAdmins() {
    try {
      const data = await fetchAdmins();
      setAdmins(data);
    } catch {
      // silent
    }
  }

  async function handleAddAdmin(e: React.FormEvent) {
    e.preventDefault();
    setAdminError("");
    setAdminSubmitting(true);
    try {
      await addAdminByEmail(adminEmail.trim());
      setAdminEmail("");
      await loadAdmins();
    } catch (err: any) {
      setAdminError(err.message);
    } finally {
      setAdminSubmitting(false);
    }
  }

  async function handleRemoveAdmin(userId: string) {
    setAdminError("");
    try {
      await removeAdmin(userId);
      await loadAdmins();
    } catch (err: any) {
      setAdminError(err.message || "Failed to remove admin");
    }
  }

  return (
    <>
      <h2 className="admin-panel__title">Manage Admins</h2>
      <form className="admin-panel__form" onSubmit={handleAddAdmin}>
        <h3 className="admin-panel__form-title">Add Admin</h3>
        <div className="admin-panel__field">
          <label htmlFor="adminEmail">User Email</label>
          <input id="adminEmail" type="email" value={adminEmail} onChange={(e) => setAdminEmail(e.target.value)} placeholder="user@example.com" required />
        </div>
        {adminError && <p className="admin-panel__error">{adminError}</p>}
        <button type="submit" className="admin-panel__submit" disabled={adminSubmitting}>
          {adminSubmitting ? "Adding..." : "Add Admin"}
        </button>
      </form>

      <h3 className="admin-panel__list-title">Current Admins ({admins.length})</h3>
      <ul className="admin-panel__list">
        {admins.map((admin) => (
          <li key={admin.id} className="admin-panel__source">
            <div className="admin-panel__source-info">
              <span className="admin-panel__source-name">{admin.email}</span>
            </div>
            <div className="admin-panel__source-actions">
              <button className="admin-panel__delete-btn" onClick={() => handleRemoveAdmin(admin.id)}>Remove</button>
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}
