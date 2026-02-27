import {
  fetchArticles,
  fetchFlags,
  createFlag,
  signup,
  login,
  logout,
  fetchCurrentUser,
  fetchLeaderboard,
  fetchAdminFeedSources,
  addFeedSource,
  deleteFeedSource,
  fetchNow,
} from "../apiClient";

const mockArticles = [
  { id: "a-1", title: "Article One", body: ["Body."], sourceTags: ["news"], fetchedAt: 1738000000000 },
  { id: "a-2", title: "Article Two", body: ["Body."], sourceTags: ["news"], fetchedAt: 1738100000000 },
];

const mockFlags = [
  { id: "f-1", articleId: "a-1", userId: "u-1", highlightedText: "Body", explanation: "Vague", timestamp: 1738000000001 },
];

beforeEach(() => {
  jest.resetAllMocks();
});

describe("fetchArticles", () => {
  it("returns articles from /api/articles with credentials", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockArticles),
    });

    const articles = await fetchArticles();

    expect(global.fetch).toHaveBeenCalledWith("/api/articles", { credentials: "include" });
    expect(articles).toEqual(mockArticles);
  });

  it("throws when the response is not ok", async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 500 });

    await expect(fetchArticles()).rejects.toThrow("Failed to fetch articles");
  });
});

describe("fetchFlags", () => {
  it("returns flags for a given article", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockFlags),
    });

    const flags = await fetchFlags("a-1");

    expect(global.fetch).toHaveBeenCalledWith("/api/articles/a-1/flags", { credentials: "include" });
    expect(flags).toEqual(mockFlags);
  });

  it("throws when the response is not ok", async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 404 });

    await expect(fetchFlags("missing")).rejects.toThrow("Failed to fetch flags");
  });
});

describe("createFlag", () => {
  it("posts flag data and returns the created flag", async () => {
    const created = { id: "f-2", articleId: "a-1", userId: "u-1", highlightedText: "Body", explanation: "Biased", timestamp: 1738000000002 };
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(created),
    });

    const result = await createFlag("a-1", { highlightedText: "Body", explanation: "Biased" });

    expect(global.fetch).toHaveBeenCalledWith("/api/articles/a-1/flags", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ highlightedText: "Body", explanation: "Biased" }),
    });
    expect(result).toEqual(created);
  });

  it("throws when the response is not ok", async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 400 });

    await expect(createFlag("a-1", { highlightedText: "", explanation: "" })).rejects.toThrow("Failed to create flag");
  });
});

describe("signup", () => {
  it("posts credentials and returns user", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ id: "u1", email: "a@b.com" }),
    });

    const user = await signup("a@b.com", "password1");

    expect(global.fetch).toHaveBeenCalledWith("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ email: "a@b.com", password: "password1" }),
    });
    expect(user).toEqual({ id: "u1", email: "a@b.com" });
  });

  it("throws with server error message on failure", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ error: "Email already registered" }),
    });

    await expect(signup("a@b.com", "password1")).rejects.toThrow("Email already registered");
  });
});

describe("login", () => {
  it("posts credentials and returns user", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ id: "u1", email: "a@b.com" }),
    });

    const user = await login("a@b.com", "password1");

    expect(global.fetch).toHaveBeenCalledWith("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ email: "a@b.com", password: "password1" }),
    });
    expect(user).toEqual({ id: "u1", email: "a@b.com" });
  });

  it("throws with server error message on failure", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ error: "Invalid email or password" }),
    });

    await expect(login("a@b.com", "wrong")).rejects.toThrow("Invalid email or password");
  });
});

describe("logout", () => {
  it("posts to logout endpoint", async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: true });

    await logout();

    expect(global.fetch).toHaveBeenCalledWith("/api/auth/logout", {
      method: "POST",
      credentials: "include",
    });
  });

  it("throws when response is not ok", async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 500 });

    await expect(logout()).rejects.toThrow("Logout failed");
  });
});

describe("fetchCurrentUser", () => {
  it("returns user when authenticated", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ id: "u1", email: "a@b.com" }),
    });

    const user = await fetchCurrentUser();

    expect(global.fetch).toHaveBeenCalledWith("/api/auth/me", { credentials: "include" });
    expect(user).toEqual({ id: "u1", email: "a@b.com" });
  });

  it("returns null when not authenticated", async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 401 });

    const user = await fetchCurrentUser();
    expect(user).toBeNull();
  });
});

describe("fetchLeaderboard", () => {
  it("returns leaderboard entries from /api/leaderboard", async () => {
    const mockEntries = [
      { sourceId: "fox-news", sourceName: "Fox News", flagCount: 5 },
      { sourceId: "cnn", sourceName: "CNN", flagCount: 3 },
    ];
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockEntries),
    });

    const entries = await fetchLeaderboard();

    expect(global.fetch).toHaveBeenCalledWith("/api/leaderboard", { credentials: "include" });
    expect(entries).toEqual(mockEntries);
  });

  it("throws when the response is not ok", async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 500 });

    await expect(fetchLeaderboard()).rejects.toThrow("Failed to fetch leaderboard");
  });
});

describe("fetchAdminFeedSources", () => {
  it("returns feed sources from /api/admin/feed-sources", async () => {
    const mockSources = [
      { sourceId: "fox-news", name: "Fox News", feedUrl: "https://fox.com/feed", defaultTags: ["politics"], isDynamic: false },
    ];
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockSources),
    });

    const sources = await fetchAdminFeedSources();

    expect(global.fetch).toHaveBeenCalledWith("/api/admin/feed-sources", { credentials: "include" });
    expect(sources).toEqual(mockSources);
  });

  it("throws when the response is not ok", async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 403 });

    await expect(fetchAdminFeedSources()).rejects.toThrow("Failed to fetch feed sources");
  });
});

describe("addFeedSource", () => {
  it("posts source data and returns the created source", async () => {
    const created = { sourceId: "new", name: "New", feedUrl: "https://new.com/feed", defaultTags: [], isDynamic: true };
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(created),
    });

    const result = await addFeedSource({
      sourceId: "new",
      name: "New",
      feedUrl: "https://new.com/feed",
      defaultTags: [],
    });

    expect(global.fetch).toHaveBeenCalledWith("/api/admin/feed-sources", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ sourceId: "new", name: "New", feedUrl: "https://new.com/feed", defaultTags: [] }),
    });
    expect(result).toEqual(created);
  });

  it("throws with server error message on failure", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ error: "sourceId is required" }),
    });

    await expect(addFeedSource({ sourceId: "", name: "X", feedUrl: "https://x.com", defaultTags: [] }))
      .rejects.toThrow("sourceId is required");
  });
});

describe("deleteFeedSource", () => {
  it("sends DELETE request for the source", async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: true });

    await deleteFeedSource("custom-source");

    expect(global.fetch).toHaveBeenCalledWith("/api/admin/feed-sources/custom-source", {
      method: "DELETE",
      credentials: "include",
    });
  });

  it("throws when the response is not ok", async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 404 });

    await expect(deleteFeedSource("nonexistent")).rejects.toThrow("Failed to delete feed source");
  });
});

describe("fetchNow", () => {
  it("triggers fetch and returns result", async () => {
    const result = { articlesFound: 10, newArticlesSaved: 3 };
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(result),
    });

    const res = await fetchNow("fox-news");

    expect(global.fetch).toHaveBeenCalledWith("/api/admin/feed-sources/fox-news/fetch", {
      method: "POST",
      credentials: "include",
    });
    expect(res).toEqual(result);
  });

  it("throws with server error on failure", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ error: "Failed to fetch feed: timeout" }),
    });

    await expect(fetchNow("broken")).rejects.toThrow("Failed to fetch feed: timeout");
  });
});
