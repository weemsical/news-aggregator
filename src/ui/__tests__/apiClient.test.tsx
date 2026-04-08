import {
  fetchArticles,
  fetchHighlights,
  createHighlight,
  updateHighlight,
  deleteHighlight,
  signup,
  login,
  logout,
  fetchCurrentUser,
  fetchScores,
  fetchAdminFeedSources,
  addFeedSource,
  deleteFeedSource,
  fetchNow,
  fetchAdmins,
  addAdminByEmail,
  removeAdmin,
} from "../apiClient";

const mockArticles = [
  { id: "a-1", title: "Article One", body: ["Body."], sourceTags: ["news"], fetchedAt: 1738000000000 },
  { id: "a-2", title: "Article Two", body: ["Body."], sourceTags: ["news"], fetchedAt: 1738100000000 },
];

const mockHighlights = [
  { id: "h-1", articleId: "a-1", userId: "u-1", paragraphIndex: 0, startOffset: 0, endOffset: 4, highlightedText: "Body", explanation: "Vague", isEdited: false, originalExplanation: null, createdAt: 1738000000001, updatedAt: 1738000000001 },
];

beforeEach(() => {
  jest.resetAllMocks();
});

describe("fetchArticles", () => {
  it("returns articles response from /api/articles with credentials", async () => {
    const mockResponse = { articles: mockArticles, total: 2, page: 1, pageSize: 20 };
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    });

    const result = await fetchArticles();

    expect(global.fetch).toHaveBeenCalledWith("/api/articles", { credentials: "include" });
    expect(result).toEqual(mockResponse);
  });

  it("passes sort and page as query params", async () => {
    const mockResponse = { articles: mockArticles, total: 2, page: 2, pageSize: 20 };
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    });

    await fetchArticles({ sort: "propaganda", page: 2 });

    expect(global.fetch).toHaveBeenCalledWith(
      "/api/articles?sort=propaganda&page=2",
      { credentials: "include" }
    );
  });

  it("throws when the response is not ok", async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 500 });

    await expect(fetchArticles()).rejects.toThrow("Failed to fetch articles");
  });
});

describe("fetchHighlights", () => {
  it("returns highlights for a given article", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockHighlights),
    });

    const highlights = await fetchHighlights("a-1");

    expect(global.fetch).toHaveBeenCalledWith("/api/articles/a-1/highlights", { credentials: "include" });
    expect(highlights).toEqual(mockHighlights);
  });

  it("throws when the response is not ok", async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 404 });

    await expect(fetchHighlights("missing")).rejects.toThrow("Failed to fetch highlights");
  });
});

describe("createHighlight", () => {
  it("posts highlight data and returns the created highlight", async () => {
    const created = { id: "h-2", articleId: "a-1", userId: "u-1", paragraphIndex: 0, startOffset: 0, endOffset: 4, highlightedText: "Body", explanation: "Biased", isEdited: false, originalExplanation: null, createdAt: 1738000000002, updatedAt: 1738000000002 };
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(created),
    });

    const data = { paragraphIndex: 0, startOffset: 0, endOffset: 4, highlightedText: "Body", explanation: "Biased" };
    const result = await createHighlight("a-1", data);

    expect(global.fetch).toHaveBeenCalledWith("/api/articles/a-1/highlights", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(data),
    });
    expect(result).toEqual(created);
  });

  it("throws when the response is not ok", async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 400 });

    await expect(createHighlight("a-1", { paragraphIndex: 0, startOffset: 0, endOffset: 4, highlightedText: "", explanation: "" })).rejects.toThrow("Failed to create highlight");
  });
});

describe("updateHighlight", () => {
  it("puts explanation and returns updated highlight", async () => {
    const updated = { ...mockHighlights[0], explanation: "Updated", isEdited: true, originalExplanation: "Vague" };
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(updated),
    });

    const result = await updateHighlight("h-1", { explanation: "Updated" });

    expect(global.fetch).toHaveBeenCalledWith("/api/highlights/h-1", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ explanation: "Updated" }),
    });
    expect(result).toEqual(updated);
  });

  it("throws when the response is not ok", async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 404 });

    await expect(updateHighlight("h-1", { explanation: "x" })).rejects.toThrow("Failed to update highlight");
  });
});

describe("deleteHighlight", () => {
  it("sends DELETE request for the highlight", async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: true });

    await deleteHighlight("h-1");

    expect(global.fetch).toHaveBeenCalledWith("/api/highlights/h-1", {
      method: "DELETE",
      credentials: "include",
    });
  });

  it("throws when the response is not ok", async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 404 });

    await expect(deleteHighlight("h-1")).rejects.toThrow("Failed to delete highlight");
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

describe("fetchScores", () => {
  it("returns scores from /api/scores", async () => {
    const mockScores = [
      { sourceId: "fox-news", sourceName: "Fox News", totalScore: 8, averageScore: 4, articleCount: 2 },
    ];
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockScores),
    });

    const scores = await fetchScores();

    expect(global.fetch).toHaveBeenCalledWith("/api/scores", { credentials: "include" });
    expect(scores).toEqual(mockScores);
  });

  it("passes date range as query params", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([]),
    });

    await fetchScores({ from: "2025-01-01", to: "2025-06-01" });

    expect(global.fetch).toHaveBeenCalledWith(
      "/api/scores?from=2025-01-01&to=2025-06-01",
      { credentials: "include" }
    );
  });

  it("throws when the response is not ok", async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 500 });

    await expect(fetchScores()).rejects.toThrow("Failed to fetch scores");
  });
});

describe("fetchAdmins", () => {
  it("returns admin users from /api/admin/admins", async () => {
    const mockAdmins = [{ id: "u1", email: "admin@test.com", isAdmin: true }];
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockAdmins),
    });

    const admins = await fetchAdmins();

    expect(global.fetch).toHaveBeenCalledWith("/api/admin/admins", { credentials: "include" });
    expect(admins).toEqual(mockAdmins);
  });
});

describe("addAdminByEmail", () => {
  it("posts email and returns admin user", async () => {
    const mockAdmin = { id: "u2", email: "new@test.com", isAdmin: true };
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockAdmin),
    });

    const result = await addAdminByEmail("new@test.com");

    expect(global.fetch).toHaveBeenCalledWith("/api/admin/admins", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ email: "new@test.com" }),
    });
    expect(result).toEqual(mockAdmin);
  });
});

describe("removeAdmin", () => {
  it("sends DELETE request", async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: true });

    await removeAdmin("u1");

    expect(global.fetch).toHaveBeenCalledWith("/api/admin/admins/u1", {
      method: "DELETE",
      credentials: "include",
    });
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
