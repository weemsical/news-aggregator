import { fetchArticles, fetchFlags, createFlag } from "../apiClient";

const mockArticles = [
  { id: "a-1", title: "Article One", body: ["Body."], sourceTags: ["news"], fetchedAt: 1738000000000 },
  { id: "a-2", title: "Article Two", body: ["Body."], sourceTags: ["news"], fetchedAt: 1738100000000 },
];

const mockFlags = [
  { id: "f-1", articleId: "a-1", highlightedText: "Body", explanation: "Vague", timestamp: 1738000000001 },
];

beforeEach(() => {
  jest.resetAllMocks();
});

describe("fetchArticles", () => {
  it("returns articles from /api/articles", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockArticles),
    });

    const articles = await fetchArticles();

    expect(global.fetch).toHaveBeenCalledWith("/api/articles");
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

    expect(global.fetch).toHaveBeenCalledWith("/api/articles/a-1/flags");
    expect(flags).toEqual(mockFlags);
  });

  it("throws when the response is not ok", async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 404 });

    await expect(fetchFlags("missing")).rejects.toThrow("Failed to fetch flags");
  });
});

describe("createFlag", () => {
  it("posts flag data and returns the created flag", async () => {
    const created = { id: "f-2", articleId: "a-1", highlightedText: "Body", explanation: "Biased", timestamp: 1738000000002 };
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(created),
    });

    const result = await createFlag("a-1", { highlightedText: "Body", explanation: "Biased" });

    expect(global.fetch).toHaveBeenCalledWith("/api/articles/a-1/flags", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ highlightedText: "Body", explanation: "Biased" }),
    });
    expect(result).toEqual(created);
  });

  it("throws when the response is not ok", async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 400 });

    await expect(createFlag("a-1", { highlightedText: "", explanation: "" })).rejects.toThrow("Failed to create flag");
  });
});
