import { TestInMemoryFeedSourceRepository } from "@helpers";
import { FeedSourceService } from "@services";
import { feedSources } from "@data";

describe("FeedSourceService", () => {
  let repo: TestInMemoryFeedSourceRepository;
  let service: FeedSourceService;

  beforeEach(() => {
    repo = new TestInMemoryFeedSourceRepository();
    service = new FeedSourceService(repo);
  });

  describe("listEnriched", () => {
    it("flags db-backed sources as dynamic and static ones as not", async () => {
      await repo.save({
        sourceId: "custom",
        name: "Custom Feed",
        feedUrl: "https://example.com/rss",
        defaultTags: [],
        publishMode: "auto",
      });

      const enriched = await service.listEnriched();
      const custom = enriched.find((s) => s.sourceId === "custom");
      const builtIn = enriched.find((s) => s.sourceId === feedSources[0].sourceId);

      expect(custom?.isDynamic).toBe(true);
      expect(builtIn?.isDynamic).toBe(false);
    });
  });

  describe("create", () => {
    it("rejects a missing sourceId", async () => {
      const result = await service.create({ sourceId: "", name: "n", feedUrl: "u" });
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.status).toBe(400);
    });

    it("rejects a missing feedUrl", async () => {
      const result = await service.create({ sourceId: "s", name: "n", feedUrl: "" });
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.status).toBe(400);
    });

    it("creates a source, trims input, and defaults publishMode to auto", async () => {
      const result = await service.create({
        sourceId: "  s1  ",
        name: "  Source One  ",
        feedUrl: "  https://example.com/rss  ",
        defaultTags: ["news", 5],
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.source.sourceId).toBe("s1");
        expect(result.source.name).toBe("Source One");
        expect(result.source.feedUrl).toBe("https://example.com/rss");
        expect(result.source.defaultTags).toEqual(["news", "5"]);
        expect(result.source.publishMode).toBe("auto");
      }
      expect(await repo.findById("s1")).toBeDefined();
    });

    it("honours an explicit manual publishMode", async () => {
      const result = await service.create({
        sourceId: "s2",
        name: "Source Two",
        feedUrl: "https://example.com/rss",
        publishMode: "manual",
      });
      if (result.ok) expect(result.source.publishMode).toBe("manual");
    });
  });

  describe("updatePublishMode", () => {
    it("updates publishMode on an existing source", async () => {
      await repo.save({
        sourceId: "s3",
        name: "Source Three",
        feedUrl: "https://example.com/rss",
        defaultTags: [],
        publishMode: "auto",
      });

      const updated = await service.updatePublishMode("s3", "manual");
      expect(updated?.publishMode).toBe("manual");
    });

    it("returns null for an unknown source", async () => {
      const updated = await service.updatePublishMode("nope", "manual");
      expect(updated).toBeNull();
    });
  });

  describe("findById", () => {
    it("resolves built-in sources", async () => {
      const found = await service.findById(feedSources[0].sourceId);
      expect(found?.sourceId).toBe(feedSources[0].sourceId);
    });
  });
});
