import { FeedSource } from "../data/feedSources";
import { FeedSourceRepository } from "../repositories/FeedSourceRepository";

export function feedSourceRepositoryContractTests(
  createRepo: () => Promise<FeedSourceRepository>,
  cleanup?: () => Promise<void>
) {
  let repo: FeedSourceRepository;

  const testSource: FeedSource = {
    sourceId: "test-source",
    name: "Test Source",
    feedUrl: "https://example.com/feed.xml",
    defaultTags: ["testing"],
  };

  const testSource2: FeedSource = {
    sourceId: "test-source-2",
    name: "Another Source",
    feedUrl: "https://example.com/feed2.xml",
    defaultTags: ["news", "world"],
  };

  beforeEach(async () => {
    repo = await createRepo();
  });

  afterEach(async () => {
    if (cleanup) await cleanup();
  });

  it("returns empty array when no sources exist", async () => {
    const all = await repo.findAll();
    expect(all).toEqual([]);
  });

  it("saves and retrieves a source by id", async () => {
    await repo.save(testSource);
    const found = await repo.findById("test-source");
    expect(found).toEqual(testSource);
  });

  it("returns undefined for a non-existent id", async () => {
    const found = await repo.findById("nonexistent");
    expect(found).toBeUndefined();
  });

  it("saves multiple sources and retrieves all", async () => {
    await repo.save(testSource);
    await repo.save(testSource2);
    const all = await repo.findAll();
    expect(all).toHaveLength(2);
  });

  it("upserts on repeated save with same sourceId", async () => {
    await repo.save(testSource);
    const updated = { ...testSource, name: "Updated Name" };
    await repo.save(updated);
    const all = await repo.findAll();
    expect(all).toHaveLength(1);
    const found = await repo.findById("test-source");
    expect(found!.name).toBe("Updated Name");
  });

  it("returns count of stored sources", async () => {
    expect(await repo.count()).toBe(0);
    await repo.save(testSource);
    expect(await repo.count()).toBe(1);
  });

  it("removes an existing source and returns true", async () => {
    await repo.save(testSource);
    const removed = await repo.remove("test-source");
    expect(removed).toBe(true);
    expect(await repo.findById("test-source")).toBeUndefined();
    expect(await repo.count()).toBe(0);
  });

  it("returns false when removing a non-existent source", async () => {
    const removed = await repo.remove("nonexistent");
    expect(removed).toBe(false);
  });
}
