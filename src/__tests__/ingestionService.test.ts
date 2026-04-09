import { IngestionService, IngestionServiceDeps } from "../services/IngestionService";
import {
  TestInMemoryArticleRepository,
  TestInMemoryRawArticleRepository,
  TestInMemoryReplacementRuleRepository,
} from "@helpers";
import { FeedSource } from "@data";

// Mock fetchFeed to avoid real HTTP
jest.mock("../services/RssFetcher", () => ({
  fetchFeed: jest.fn(),
}));

import { fetchFeed } from "../services/RssFetcher";
const mockFetchFeed = fetchFeed as jest.MockedFunction<typeof fetchFeed>;

const validRss = `<?xml version="1.0"?>
<rss version="2.0"><channel>
  <item><title>Article 1</title><link>https://example.com/1</link><description>Content here</description></item>
  <item><title>Article 2</title><link>https://example.com/2</link><description>More content</description></item>
</channel></rss>`;

function buildDeps(): IngestionServiceDeps {
  return {
    articles: new TestInMemoryArticleRepository(),
    rawArticles: new TestInMemoryRawArticleRepository(),
    replacementRules: new TestInMemoryReplacementRuleRepository(),
  };
}

const testSource: FeedSource = {
  sourceId: "src-1",
  name: "Source 1",
  feedUrl: "https://src1.com/feed",
  defaultTags: ["news"],
  publishMode: "auto",
};

describe("IngestionService", () => {
  beforeEach(() => {
    mockFetchFeed.mockReset();
  });

  it("fetches and saves articles for a single feed", async () => {
    const deps = buildDeps();
    mockFetchFeed.mockResolvedValue({ ok: true, xml: validRss });

    const result = await IngestionService.fetchAndSaveFeed(testSource, deps);

    expect(result.success).toBe(true);
    expect(result.articlesSaved).toBe(2);
    expect(await deps.articles.count()).toBe(2);
    expect(await deps.rawArticles.count()).toBe(2);
  });

  it("returns failure when fetch fails", async () => {
    const deps = buildDeps();
    mockFetchFeed.mockResolvedValue({ ok: false, error: "timeout" });

    const result = await IngestionService.fetchAndSaveFeed(testSource, deps);

    expect(result.success).toBe(false);
    expect(result.error).toBe("timeout");
    expect(result.articlesSaved).toBe(0);
  });

  it("skips already existing articles", async () => {
    const deps = buildDeps();
    mockFetchFeed.mockResolvedValue({ ok: true, xml: validRss });

    // First call saves articles
    await IngestionService.fetchAndSaveFeed(testSource, deps);
    expect(await deps.articles.count()).toBe(2);

    // Second call skips them
    const result = await IngestionService.fetchAndSaveFeed(testSource, deps);
    expect(result.articlesSaved).toBe(0);
    expect(await deps.articles.count()).toBe(2);
  });

  it("applies replacement rules to article bodies", async () => {
    const deps = buildDeps();
    await deps.replacementRules.save({
      id: "r1",
      sourceId: "src-1",
      pattern: "Content",
      replacementText: "[redacted]",
      isRegex: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    const rss = `<?xml version="1.0"?>
    <rss version="2.0"><channel>
      <item><title>Test</title><link>https://example.com/test</link><description>Content here</description></item>
    </channel></rss>`;
    mockFetchFeed.mockResolvedValue({ ok: true, xml: rss });

    await IngestionService.fetchAndSaveFeed(testSource, deps);

    const articles = await deps.articles.findApproved();
    expect(articles.some((a) => a.body.some((p: string) => p.includes("[redacted]")))).toBe(true);
  });

  it("sets review status based on publishMode", async () => {
    const deps = buildDeps();
    mockFetchFeed.mockResolvedValue({ ok: true, xml: validRss });

    const manualSource: FeedSource = { ...testSource, publishMode: "manual" };
    await IngestionService.fetchAndSaveFeed(manualSource, deps);

    const pending = await deps.articles.findByReviewStatus("pending");
    expect(pending.length).toBe(2);
  });

  it("rolls back raw article when article save fails", async () => {
    const deps = buildDeps();
    const rss = `<?xml version="1.0"?>
    <rss version="2.0"><channel>
      <item><title>Fail</title><link>https://example.com/fail</link><description>Content</description></item>
    </channel></rss>`;
    mockFetchFeed.mockResolvedValue({ ok: true, xml: rss });

    const originalSave = deps.articles.save.bind(deps.articles);
    jest.spyOn(deps.articles, "save").mockImplementation(async () => {
      throw new Error("DB write failed");
    });

    const result = await IngestionService.fetchAndSaveFeed(testSource, deps);

    expect(result.success).toBe(false);
    expect(result.error).toBe("DB write failed");
    expect(await deps.rawArticles.count()).toBe(0);
  });
});
