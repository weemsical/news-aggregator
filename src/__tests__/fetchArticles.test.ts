import { runFetchArticles } from "../scripts/fetchArticles";
import * as RssFetcher from "../services/RssFetcher";
import { TestInMemoryArticleRepository } from "./helpers/TestInMemoryArticleRepository";

jest.mock("../services/RssFetcher");
const mockFetchFeed = RssFetcher.fetchFeed as jest.MockedFunction<typeof RssFetcher.fetchFeed>;

const rssXml = (title: string, link: string) => `<?xml version="1.0"?>
  <rss version="2.0">
    <channel>
      <item>
        <title>${title}</title>
        <link>${link}</link>
        <description>Description for ${title}.</description>
      </item>
    </channel>
  </rss>`;

describe("runFetchArticles", () => {
  let repo: TestInMemoryArticleRepository;

  beforeEach(() => {
    repo = new TestInMemoryArticleRepository();
    mockFetchFeed.mockReset();
  });

  it("fetches all sources and saves articles to the repository", async () => {
    mockFetchFeed.mockResolvedValue({ ok: true, xml: rssXml("Test Article", "https://example.com/1") });

    const result = await runFetchArticles(repo);

    const articles = await repo.findAll();
    expect(articles.length).toBeGreaterThan(0);
    expect(result.failedSources).toHaveLength(0);
  });

  it("continues past individual source failures", async () => {
    let callCount = 0;
    mockFetchFeed.mockImplementation(async () => {
      callCount++;
      if (callCount === 1) {
        return { ok: false, error: "Network error" };
      }
      return { ok: true, xml: rssXml("Good Article", "https://example.com/good") };
    });

    const result = await runFetchArticles(repo);

    expect(result.failedSources.length).toBeGreaterThan(0);
    const articles = await repo.findAll();
    expect(articles.length).toBeGreaterThan(0);
  });

  it("reports all sources as failed when every fetch fails", async () => {
    mockFetchFeed.mockResolvedValue({ ok: false, error: "All down" });

    const result = await runFetchArticles(repo);

    expect(result.failedSources).toHaveLength(8);
    expect(result.totalArticles).toBe(0);
  });

  it("deduplicates articles by ID across runs", async () => {
    mockFetchFeed.mockResolvedValue({ ok: true, xml: rssXml("Same Article", "https://example.com/same") });
    await runFetchArticles(repo);

    const firstCount = await repo.count();

    mockFetchFeed.mockResolvedValue({ ok: true, xml: rssXml("Same Article", "https://example.com/same") });
    await runFetchArticles(repo);

    const secondCount = await repo.count();
    expect(secondCount).toBe(firstCount);
  });

  it("merges new articles with existing ones", async () => {
    mockFetchFeed.mockResolvedValue({ ok: true, xml: rssXml("First Article", "https://example.com/first") });
    await runFetchArticles(repo);

    const firstCount = await repo.count();

    mockFetchFeed.mockResolvedValue({ ok: true, xml: rssXml("Second Article", "https://example.com/second") });
    await runFetchArticles(repo);

    const secondCount = await repo.count();
    expect(secondCount).toBeGreaterThan(firstCount);
  });

  it("returns summary with total articles and failed sources", async () => {
    mockFetchFeed.mockResolvedValue({ ok: true, xml: rssXml("Test", "https://example.com/t") });

    const result = await runFetchArticles(repo);

    expect(typeof result.totalArticles).toBe("number");
    expect(Array.isArray(result.failedSources)).toBe(true);
  });
});
