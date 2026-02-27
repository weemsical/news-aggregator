import {
  fetchArticles,
  fetchFlags,
  createFlag,
  signup,
  login,
  logout,
  fetchCurrentUser,
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
