import { fetchFeed } from "@services";

const originalFetch = global.fetch;

afterEach(() => {
  global.fetch = originalFetch;
});

describe("fetchFeed", () => {
  it("returns xml on successful fetch", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      text: () => Promise.resolve("<rss>data</rss>"),
    });

    const result = await fetchFeed("https://example.com/feed");
    expect(result.ok).toBe(true);
    expect(result.xml).toBe("<rss>data</rss>");
    expect(result.error).toBeUndefined();
  });

  it("returns error when response is not ok", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 404,
      text: () => Promise.resolve("Not Found"),
    });

    const result = await fetchFeed("https://example.com/feed");
    expect(result.ok).toBe(false);
    expect(result.xml).toBeUndefined();
    expect(result.error).toContain("404");
  });

  it("returns error on network failure", async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error("Network error"));

    const result = await fetchFeed("https://example.com/feed");
    expect(result.ok).toBe(false);
    expect(result.xml).toBeUndefined();
    expect(result.error).toContain("Network error");
  });

  it("passes the url to fetch", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      text: () => Promise.resolve("<rss/>"),
    });

    await fetchFeed("https://example.com/my-feed");
    expect(global.fetch).toHaveBeenCalledWith(
      "https://example.com/my-feed",
      expect.objectContaining({ signal: expect.any(AbortSignal) })
    );
  });

  it("returns error on timeout (AbortError)", async () => {
    const abortError = new Error("The operation was aborted");
    abortError.name = "AbortError";
    global.fetch = jest.fn().mockRejectedValue(abortError);

    const result = await fetchFeed("https://example.com/feed");
    expect(result.ok).toBe(false);
    expect(result.error).toBeDefined();
  });
});
