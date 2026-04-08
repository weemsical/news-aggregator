import { feedSources, FeedSource } from "@data";

describe("feedSources", () => {
  const expectedSourceIds = [
    "fox-news",
    "cnn",
    "bbc",
    "reuters",
    "msnbc",
    "ap-news",
    "new-york-post",
    "the-guardian",
  ];

  it("exports exactly 8 feed sources", () => {
    expect(feedSources).toHaveLength(8);
  });

  it("includes all 8 expected sourceIds", () => {
    const ids = feedSources.map((s) => s.sourceId);
    expect(ids.sort()).toEqual(expectedSourceIds.sort());
  });

  it("has no duplicate sourceIds", () => {
    const ids = feedSources.map((s) => s.sourceId);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it.each(expectedSourceIds)("source %s has valid fields", (sourceId) => {
    const source = feedSources.find((s) => s.sourceId === sourceId);
    expect(source).toBeDefined();
    expect(source!.name).toBeTruthy();
    expect(source!.feedUrl).toMatch(/^https:\/\//);
    expect(source!.defaultTags).toBeInstanceOf(Array);
    expect(source!.defaultTags.length).toBeGreaterThan(0);
  });
});
