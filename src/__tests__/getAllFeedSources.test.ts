import { getAllFeedSources, feedSources } from "@data";
import { TestInMemoryFeedSourceRepository } from "@helpers";

describe("getAllFeedSources", () => {
  it("returns static sources when DB is empty", async () => {
    const repo = new TestInMemoryFeedSourceRepository();
    const all = await getAllFeedSources(repo);
    expect(all).toHaveLength(feedSources.length);
    expect(all.map((s) => s.sourceId)).toEqual(
      feedSources.map((s) => s.sourceId)
    );
  });

  it("includes DB-only sources alongside static ones", async () => {
    const repo = new TestInMemoryFeedSourceRepository();
    await repo.save({
      sourceId: "custom-source",
      name: "Custom Source",
      feedUrl: "https://example.com/feed.xml",
      defaultTags: ["custom"],
    });

    const all = await getAllFeedSources(repo);
    expect(all).toHaveLength(feedSources.length + 1);
    expect(all.find((s) => s.sourceId === "custom-source")).toEqual({
      sourceId: "custom-source",
      name: "Custom Source",
      feedUrl: "https://example.com/feed.xml",
      defaultTags: ["custom"],
      publishMode: "auto",
    });
  });

  it("DB source overrides static source with same sourceId", async () => {
    const repo = new TestInMemoryFeedSourceRepository();
    await repo.save({
      sourceId: "fox-news",
      name: "Fox News (Custom URL)",
      feedUrl: "https://custom.foxnews.com/feed.xml",
      defaultTags: ["politics"],
    });

    const all = await getAllFeedSources(repo);
    expect(all).toHaveLength(feedSources.length);
    const fox = all.find((s) => s.sourceId === "fox-news");
    expect(fox!.name).toBe("Fox News (Custom URL)");
    expect(fox!.feedUrl).toBe("https://custom.foxnews.com/feed.xml");
  });

  it("preserves all static sources when DB has no overlapping IDs", async () => {
    const repo = new TestInMemoryFeedSourceRepository();
    await repo.save({
      sourceId: "new-source",
      name: "New Source",
      feedUrl: "https://new.com/feed.xml",
      defaultTags: [],
    });

    const all = await getAllFeedSources(repo);
    for (const staticSource of feedSources) {
      expect(all.find((s) => s.sourceId === staticSource.sourceId)).toEqual(
        staticSource
      );
    }
  });
});
