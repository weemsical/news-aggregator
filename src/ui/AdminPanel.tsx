import { useState, useEffect } from "react";
import {
  AdminFeedSource,
  AdminUser,
  FetchNowResult,
  fetchAdminFeedSources,
  addFeedSource,
  deleteFeedSource,
  fetchNow,
  fetchAdmins,
  addAdminByEmail,
  removeAdmin,
} from "./apiClient";
import "./AdminPanel.css";

export function AdminPanel() {
  const [sources, setSources] = useState<AdminFeedSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [sourceId, setSourceId] = useState("");
  const [name, setName] = useState("");
  const [feedUrl, setFeedUrl] = useState("");
  const [defaultTags, setDefaultTags] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [addError, setAddError] = useState("");

  const [fetchResults, setFetchResults] = useState<
    Record<string, FetchNowResult | string>
  >({});

  // Admin management state
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [adminEmail, setAdminEmail] = useState("");
  const [adminSubmitting, setAdminSubmitting] = useState(false);
  const [adminError, setAdminError] = useState("");

  useEffect(() => {
    loadSources();
    loadAdmins();
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

  async function loadAdmins() {
    try {
      const data = await fetchAdmins();
      setAdmins(data);
    } catch {
      // Silently fail — admin list is secondary
    }
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setAddError("");
    setSubmitting(true);

    try {
      const tags = defaultTags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);
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
      await loadSources();
    } catch (err: any) {
      setAddError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(sid: string) {
    try {
      await deleteFeedSource(sid);
      await loadSources();
    } catch {
      setError("Failed to delete feed source");
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

  if (loading) {
    return <p className="admin-panel__loading">Loading feed sources...</p>;
  }

  return (
    <div className="admin-panel">
      <h2 className="admin-panel__title">Manage Feed Sources</h2>

      {error && <p className="admin-panel__error">{error}</p>}

      <form className="admin-panel__form" onSubmit={handleAdd}>
        <h3 className="admin-panel__form-title">Add New Source</h3>
        <div className="admin-panel__field">
          <label htmlFor="sourceId">Source ID</label>
          <input
            id="sourceId"
            type="text"
            value={sourceId}
            onChange={(e) => setSourceId(e.target.value)}
            placeholder="e.g. daily-wire"
            required
          />
        </div>
        <div className="admin-panel__field">
          <label htmlFor="name">Display Name</label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. The Daily Wire"
            required
          />
        </div>
        <div className="admin-panel__field">
          <label htmlFor="feedUrl">Feed URL</label>
          <input
            id="feedUrl"
            type="url"
            value={feedUrl}
            onChange={(e) => setFeedUrl(e.target.value)}
            placeholder="https://example.com/feed.xml"
            required
          />
        </div>
        <div className="admin-panel__field">
          <label htmlFor="defaultTags">Tags (comma-separated)</label>
          <input
            id="defaultTags"
            type="text"
            value={defaultTags}
            onChange={(e) => setDefaultTags(e.target.value)}
            placeholder="e.g. politics, conservative"
          />
        </div>
        {addError && <p className="admin-panel__error">{addError}</p>}
        <button
          type="submit"
          className="admin-panel__submit"
          disabled={submitting}
        >
          {submitting ? "Adding..." : "Add Source"}
        </button>
      </form>

      <h3 className="admin-panel__list-title">
        Current Sources ({sources.length})
      </h3>
      <ul className="admin-panel__list">
        {sources.map((source) => (
          <li key={source.sourceId} className="admin-panel__source">
            <div className="admin-panel__source-info">
              <span className="admin-panel__source-name">{source.name}</span>
              <span className="admin-panel__source-id">{source.sourceId}</span>
              {source.isDynamic && (
                <span className="admin-panel__badge">custom</span>
              )}
            </div>
            <div className="admin-panel__source-actions">
              <button
                className="admin-panel__fetch-btn"
                onClick={() => handleFetchNow(source.sourceId)}
                disabled={fetchResults[source.sourceId] === "fetching"}
              >
                {fetchResults[source.sourceId] === "fetching"
                  ? "Fetching..."
                  : "Fetch Now"}
              </button>
              {source.isDynamic && (
                <button
                  className="admin-panel__delete-btn"
                  onClick={() => handleDelete(source.sourceId)}
                >
                  Delete
                </button>
              )}
            </div>
            {fetchResults[source.sourceId] &&
              fetchResults[source.sourceId] !== "fetching" && (
                <div className="admin-panel__fetch-result">
                  {typeof fetchResults[source.sourceId] === "string" ? (
                    <span className="admin-panel__fetch-error">
                      {fetchResults[source.sourceId] as string}
                    </span>
                  ) : (
                    <span className="admin-panel__fetch-success">
                      Found{" "}
                      {(fetchResults[source.sourceId] as FetchNowResult).articlesFound}{" "}
                      articles, saved{" "}
                      {(fetchResults[source.sourceId] as FetchNowResult).newArticlesSaved}{" "}
                      new
                    </span>
                  )}
                </div>
              )}
          </li>
        ))}
      </ul>

      <hr className="admin-panel__divider" />

      <h2 className="admin-panel__title">Manage Admins</h2>

      <form className="admin-panel__form" onSubmit={handleAddAdmin}>
        <h3 className="admin-panel__form-title">Add Admin</h3>
        <div className="admin-panel__field">
          <label htmlFor="adminEmail">User Email</label>
          <input
            id="adminEmail"
            type="email"
            value={adminEmail}
            onChange={(e) => setAdminEmail(e.target.value)}
            placeholder="user@example.com"
            required
          />
        </div>
        {adminError && <p className="admin-panel__error">{adminError}</p>}
        <button
          type="submit"
          className="admin-panel__submit"
          disabled={adminSubmitting}
        >
          {adminSubmitting ? "Adding..." : "Add Admin"}
        </button>
      </form>

      <h3 className="admin-panel__list-title">
        Current Admins ({admins.length})
      </h3>
      <ul className="admin-panel__list">
        {admins.map((admin) => (
          <li key={admin.id} className="admin-panel__source">
            <div className="admin-panel__source-info">
              <span className="admin-panel__source-name">{admin.email}</span>
            </div>
            <div className="admin-panel__source-actions">
              <button
                className="admin-panel__delete-btn"
                onClick={() => handleRemoveAdmin(admin.id)}
              >
                Remove
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
