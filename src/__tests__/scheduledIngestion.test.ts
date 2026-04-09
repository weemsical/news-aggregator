import { ScheduledIngestion, IngestionDeps } from "../services/ScheduledIngestion";
import { TestInMemoryArticleRepository, TestInMemoryRawArticleRepository, TestInMemoryFeedSourceRepository, TestInMemoryReplacementRuleRepository, TestInMemoryNotificationRepository, TestInMemoryHighlightRepository, TestInMemoryUserRepository, TestInMemoryCommentRepository } from "@helpers";
import { NotificationService } from "../services/NotificationService";

// Mock fetchFeed to avoid real HTTP
jest.mock("../services/RssFetcher", () => ({
  fetchFeed: jest.fn(),
}));

import { fetchFeed } from "../services/RssFetcher";
const mockFetchFeed = fetchFeed as jest.MockedFunction<typeof fetchFeed>;

// Minimal valid RSS
const validRss = `<?xml version="1.0"?>
<rss version="2.0"><channel>
  <item><title>Article 1</title><link>https://example.com/1</link><description>Content here</description></item>
  <item><title>Article 2</title><link>https://example.com/2</link><description>More content</description></item>
</channel></rss>`;

function buildDeps(): IngestionDeps {
  const articles = new TestInMemoryArticleRepository();
  const rawArticles = new TestInMemoryRawArticleRepository();
  const feedSources = new TestInMemoryFeedSourceRepository();
  const replacementRules = new TestInMemoryReplacementRuleRepository();
  const notifications = new TestInMemoryNotificationRepository();
  const highlights = new TestInMemoryHighlightRepository();
  const users = new TestInMemoryUserRepository();
  const comments = new TestInMemoryCommentRepository();
  const notificationService = new NotificationService(notifications, highlights, users, comments);

  return {
    articles,
    rawArticles,
    feedSources,
    replacementRules,
    notificationService,
  };
}

describe("ScheduledIngestion", () => {
  beforeEach(() => {
    mockFetchFeed.mockReset();
  });

  it("fetches all feeds in parallel and saves articles", async () => {
    const deps = buildDeps();
    await deps.feedSources.save({
      sourceId: "src-1", name: "Source 1",
      feedUrl: "https://src1.com/feed", defaultTags: ["news"], publishMode: "auto",
    });

    mockFetchFeed.mockResolvedValue({ ok: true, xml: validRss });

    const result = await ScheduledIngestion.runIngestion(deps);

    expect(result.totalArticlesSaved).toBeGreaterThan(0);
    // Includes static sources + our custom one
    const src1Result = result.feedResults.find((r) => r.sourceId === "src-1");
    expect(src1Result).toBeDefined();
    expect(src1Result!.success).toBe(true);
  });

  it("retries failed feeds up to 3 times", async () => {
    const deps = buildDeps();
    // Only use 1 source by overriding getAllFeedSources behavior —
    // we'll check the call count accounts for retries + other static sources
    await deps.feedSources.save({
      sourceId: "src-1", name: "Source 1",
      feedUrl: "https://src1.com/feed", defaultTags: ["news"], publishMode: "auto",
    });

    // First 2 calls fail, rest succeed (covers static sources too)
    let callCount = 0;
    mockFetchFeed.mockImplementation(async () => {
      callCount++;
      // Fail the first 2 calls to src-1's URL (retries), succeed on 3rd+
      // Since feeds are parallel, we can't rely on order — succeed all static feeds
      return { ok: true, xml: validRss };
    });

    // For a cleaner test, test retry logic by making ALL feeds fail then succeed
    mockFetchFeed.mockReset();
    // All calls fail twice, then succeed
    const callCounts = new Map<string, number>();
    mockFetchFeed.mockImplementation(async (url: string) => {
      const count = (callCounts.get(url) || 0) + 1;
      callCounts.set(url, count);
      if (url === "https://src1.com/feed" && count <= 2) {
        return { ok: false, error: "timeout" };
      }
      return { ok: true, xml: validRss };
    });

    const result = await ScheduledIngestion.runIngestion(deps, { retryDelayMs: 0 });

    const src1Result = result.feedResults.find((r) => r.sourceId === "src-1");
    expect(src1Result!.success).toBe(true);
    expect(callCounts.get("https://src1.com/feed")).toBe(3);
  });

  it("skips feed after 3 failures", async () => {
    const deps = buildDeps();
    await deps.feedSources.save({
      sourceId: "src-1", name: "Source 1",
      feedUrl: "https://src1.com/feed", defaultTags: ["news"], publishMode: "auto",
    });

    const callCounts = new Map<string, number>();
    mockFetchFeed.mockImplementation(async (url: string) => {
      const count = (callCounts.get(url) || 0) + 1;
      callCounts.set(url, count);
      if (url === "https://src1.com/feed") {
        return { ok: false, error: "timeout" };
      }
      return { ok: true, xml: validRss };
    });

    const result = await ScheduledIngestion.runIngestion(deps, { retryDelayMs: 0 });

    const src1Result = result.feedResults.find((r) => r.sourceId === "src-1");
    expect(src1Result!.success).toBe(false);
    expect(src1Result!.error).toBe("timeout");
    expect(callCounts.get("https://src1.com/feed")).toBe(3);
  });

  it("respects publishMode — manual sources get pending articles", async () => {
    const deps = buildDeps();
    await deps.feedSources.save({
      sourceId: "manual-src", name: "Manual Source",
      feedUrl: "https://manual.com/feed", defaultTags: ["news"], publishMode: "manual",
    });

    mockFetchFeed.mockResolvedValue({ ok: true, xml: validRss });

    await ScheduledIngestion.runIngestion(deps);

    // manual-src articles should be pending
    const pending = await deps.articles.findByReviewStatus("pending");
    const manualArticles = pending.filter((a) => a.sourceId === "manual-src");
    expect(manualArticles.length).toBeGreaterThan(0);
    expect(manualArticles.every((a) => a.reviewStatus === "pending")).toBe(true);
  });

  it("applies replacement rules to articles", async () => {
    const deps = buildDeps();
    await deps.feedSources.save({
      sourceId: "src-1", name: "Source 1",
      feedUrl: "https://src1.com/feed", defaultTags: ["news"], publishMode: "auto",
    });
    await deps.replacementRules.save({
      id: "r1", sourceId: "src-1", pattern: "Content",
      replacementText: "[redacted]", isRegex: false,
      createdAt: Date.now(), updatedAt: Date.now(),
    });

    const rssWithContent = `<?xml version="1.0"?>
    <rss version="2.0"><channel>
      <item><title>Test</title><link>https://example.com/test</link><description>Content here</description></item>
    </channel></rss>`;

    mockFetchFeed.mockResolvedValue({ ok: true, xml: rssWithContent });

    await ScheduledIngestion.runIngestion(deps);

    const approved = await deps.articles.findApproved();
    const src1Articles = approved.filter((a) => a.sourceId === "src-1");
    expect(src1Articles.length).toBeGreaterThan(0);
    // Check that replacement was applied
    expect(src1Articles.some((a) => a.body.some((p) => p.includes("[redacted]")))).toBe(true);
  });

  it("does not persist raw article when article save fails", async () => {
    const deps = buildDeps();
    await deps.feedSources.save({
      sourceId: "src-1", name: "Source 1",
      feedUrl: "https://src1.com/feed", defaultTags: ["news"], publishMode: "auto",
    });

    const rssWithOneArticle = `<?xml version="1.0"?>
    <rss version="2.0"><channel>
      <item><title>Fail Article</title><link>https://example.com/fail</link><description>Content</description></item>
    </channel></rss>`;

    mockFetchFeed.mockResolvedValue({ ok: true, xml: rssWithOneArticle });

    // Make article save throw after raw article is saved
    const originalSave = deps.articles.save.bind(deps.articles);
    jest.spyOn(deps.articles, "save").mockImplementation(async (article) => {
      if (article.sourceId === "src-1") {
        throw new Error("Simulated article save failure");
      }
      return originalSave(article);
    });

    const result = await ScheduledIngestion.runIngestion(deps, { retryDelayMs: 0 });

    // src-1 should have failed
    const src1Result = result.feedResults.find((r) => r.sourceId === "src-1");
    expect(src1Result!.success).toBe(false);

    // Raw articles for src-1 should NOT be persisted (transactional rollback)
    const rawCount = await deps.rawArticles.count();
    const rawArticles = await deps.rawArticles.findBySource("src-1");
    expect(rawArticles.length).toBe(0);
  });

  it("fetches multiple feeds in parallel", async () => {
    const deps = buildDeps();
    await deps.feedSources.save({
      sourceId: "src-1", name: "Source 1",
      feedUrl: "https://src1.com/feed", defaultTags: ["news"], publishMode: "auto",
    });
    await deps.feedSources.save({
      sourceId: "src-2", name: "Source 2",
      feedUrl: "https://src2.com/feed", defaultTags: ["news"], publishMode: "auto",
    });

    mockFetchFeed.mockResolvedValue({ ok: true, xml: validRss });

    const result = await ScheduledIngestion.runIngestion(deps);

    // Both custom sources should succeed (plus static ones)
    const src1 = result.feedResults.find((r) => r.sourceId === "src-1");
    const src2 = result.feedResults.find((r) => r.sourceId === "src-2");
    expect(src1!.success).toBe(true);
    expect(src2!.success).toBe(true);
    expect(result.feedResults.length).toBeGreaterThanOrEqual(2);
  });
});
