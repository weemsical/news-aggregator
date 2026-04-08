import { parseRssFeed } from "@services";
import { FeedSource } from "../data/feedSources";

const source: FeedSource = {
  sourceId: "test-source",
  name: "Test Source",
  feedUrl: "https://example.com/feed",
  defaultTags: ["politics"],
};

describe("parseRssFeed", () => {
  // --- RSS 2.0 ---

  it("parses a basic RSS 2.0 feed", () => {
    const xml = `<?xml version="1.0"?>
      <rss version="2.0">
        <channel>
          <item>
            <title>Test Article</title>
            <link>https://example.com/article-1</link>
            <description>This is a test description.</description>
          </item>
        </channel>
      </rss>`;

    const articles = parseRssFeed(xml, source);
    expect(articles).toHaveLength(1);
    expect(articles[0].title).toBe("Test Article");
    expect(articles[0].url).toBe("https://example.com/article-1");
    expect(articles[0].body).toEqual(["This is a test description."]);
    expect(articles[0].sourceId).toBe("test-source");
  });

  it("parses multiple items from RSS 2.0", () => {
    const xml = `<?xml version="1.0"?>
      <rss version="2.0">
        <channel>
          <item>
            <title>Article One</title>
            <link>https://example.com/1</link>
            <description>First desc.</description>
          </item>
          <item>
            <title>Article Two</title>
            <link>https://example.com/2</link>
            <description>Second desc.</description>
          </item>
        </channel>
      </rss>`;

    const articles = parseRssFeed(xml, source);
    expect(articles).toHaveLength(2);
    expect(articles[0].title).toBe("Article One");
    expect(articles[1].title).toBe("Article Two");
  });

  it("generates deterministic IDs from sourceId + link", () => {
    const xml = `<?xml version="1.0"?>
      <rss version="2.0">
        <channel>
          <item>
            <title>Test</title>
            <link>https://example.com/article-1</link>
            <description>Desc.</description>
          </item>
        </channel>
      </rss>`;

    const articles1 = parseRssFeed(xml, source);
    const articles2 = parseRssFeed(xml, source);
    expect(articles1[0].id).toBe(articles2[0].id);
    expect(articles1[0].id).toContain("test-source");
  });

  it("strips HTML tags from description", () => {
    const xml = `<?xml version="1.0"?>
      <rss version="2.0">
        <channel>
          <item>
            <title>HTML Test</title>
            <link>https://example.com/html</link>
            <description>&lt;b&gt;Bold text&lt;/b&gt; and &lt;a href="x"&gt;a link&lt;/a&gt;</description>
          </item>
        </channel>
      </rss>`;

    const articles = parseRssFeed(xml, source);
    expect(articles[0].body).toEqual(["Bold text and a link"]);
  });

  it("splits description on <p> tags into multiple body paragraphs", () => {
    const xml = `<?xml version="1.0"?>
      <rss version="2.0">
        <channel>
          <item>
            <title>Paragraph Test</title>
            <link>https://example.com/para</link>
            <description>&lt;p&gt;First paragraph.&lt;/p&gt;&lt;p&gt;Second paragraph.&lt;/p&gt;</description>
          </item>
        </channel>
      </rss>`;

    const articles = parseRssFeed(xml, source);
    expect(articles[0].body).toEqual(["First paragraph.", "Second paragraph."]);
  });

  it("splits description on <br> tags into multiple body paragraphs", () => {
    const xml = `<?xml version="1.0"?>
      <rss version="2.0">
        <channel>
          <item>
            <title>BR Test</title>
            <link>https://example.com/br</link>
            <description>Line one.&lt;br/&gt;Line two.&lt;br&gt;Line three.</description>
          </item>
        </channel>
      </rss>`;

    const articles = parseRssFeed(xml, source);
    expect(articles[0].body).toEqual(["Line one.", "Line two.", "Line three."]);
  });

  it("maps RSS categories to sourceTags", () => {
    const xml = `<?xml version="1.0"?>
      <rss version="2.0">
        <channel>
          <item>
            <title>Category Test</title>
            <link>https://example.com/cat</link>
            <description>Desc.</description>
            <category>Politics</category>
            <category>Economy</category>
          </item>
        </channel>
      </rss>`;

    const articles = parseRssFeed(xml, source);
    expect(articles[0].sourceTags).toContain("politics");
    expect(articles[0].sourceTags).toContain("economy");
  });

  it("falls back to defaultTags when no categories are present", () => {
    const xml = `<?xml version="1.0"?>
      <rss version="2.0">
        <channel>
          <item>
            <title>No Category</title>
            <link>https://example.com/nocat</link>
            <description>Desc.</description>
          </item>
        </channel>
      </rss>`;

    const articles = parseRssFeed(xml, source);
    expect(articles[0].sourceTags).toEqual(["politics"]);
  });

  it("sets fetchedAt to a recent timestamp", () => {
    const before = Date.now();
    const xml = `<?xml version="1.0"?>
      <rss version="2.0">
        <channel>
          <item>
            <title>Time Test</title>
            <link>https://example.com/time</link>
            <description>Desc.</description>
          </item>
        </channel>
      </rss>`;

    const articles = parseRssFeed(xml, source);
    const after = Date.now();
    expect(articles[0].fetchedAt).toBeGreaterThanOrEqual(before);
    expect(articles[0].fetchedAt).toBeLessThanOrEqual(after);
  });

  it("skips items missing title or link", () => {
    const xml = `<?xml version="1.0"?>
      <rss version="2.0">
        <channel>
          <item>
            <title>Valid</title>
            <link>https://example.com/valid</link>
            <description>Valid desc.</description>
          </item>
          <item>
            <title>No Link</title>
            <description>Missing link.</description>
          </item>
          <item>
            <link>https://example.com/no-title</link>
            <description>Missing title.</description>
          </item>
        </channel>
      </rss>`;

    const articles = parseRssFeed(xml, source);
    expect(articles).toHaveLength(1);
    expect(articles[0].title).toBe("Valid");
  });

  // --- Atom ---

  it("parses an Atom feed", () => {
    const xml = `<?xml version="1.0"?>
      <feed xmlns="http://www.w3.org/2005/Atom">
        <entry>
          <title>Atom Article</title>
          <link href="https://example.com/atom-1"/>
          <summary>Atom description.</summary>
        </entry>
      </feed>`;

    const articles = parseRssFeed(xml, source);
    expect(articles).toHaveLength(1);
    expect(articles[0].title).toBe("Atom Article");
    expect(articles[0].url).toBe("https://example.com/atom-1");
    expect(articles[0].body).toEqual(["Atom description."]);
  });

  it("uses Atom content when summary is absent", () => {
    const xml = `<?xml version="1.0"?>
      <feed xmlns="http://www.w3.org/2005/Atom">
        <entry>
          <title>Content Entry</title>
          <link href="https://example.com/content"/>
          <content type="html">&lt;p&gt;HTML content here.&lt;/p&gt;</content>
        </entry>
      </feed>`;

    const articles = parseRssFeed(xml, source);
    expect(articles[0].body).toEqual(["HTML content here."]);
  });

  // --- Edge cases ---

  it("returns empty array for invalid XML", () => {
    const articles = parseRssFeed("not xml at all", source);
    expect(articles).toEqual([]);
  });

  it("returns empty array for valid XML with no items", () => {
    const xml = `<?xml version="1.0"?>
      <rss version="2.0">
        <channel>
          <title>Empty Feed</title>
        </channel>
      </rss>`;

    const articles = parseRssFeed(xml, source);
    expect(articles).toEqual([]);
  });

  it("decodes HTML entities in title", () => {
    const xml = `<?xml version="1.0"?>
      <rss version="2.0">
        <channel>
          <item>
            <title>Trump &amp; Biden&#39;s &quot;debate&quot;</title>
            <link>https://example.com/entities</link>
            <description>Desc.</description>
          </item>
        </channel>
      </rss>`;

    const articles = parseRssFeed(xml, source);
    expect(articles[0].title).toBe("Trump & Biden's \"debate\"");
  });

  it("handles single-item feed (not wrapped in array by parser)", () => {
    const xml = `<?xml version="1.0"?>
      <rss version="2.0">
        <channel>
          <item>
            <title>Solo Item</title>
            <link>https://example.com/solo</link>
            <description>Only one.</description>
          </item>
        </channel>
      </rss>`;

    const articles = parseRssFeed(xml, source);
    expect(articles).toHaveLength(1);
  });

  it("uses subtitle from item if present", () => {
    const xml = `<?xml version="1.0"?>
      <rss version="2.0">
        <channel>
          <item>
            <title>Main Title</title>
            <link>https://example.com/sub</link>
            <description>Body text here.</description>
          </item>
        </channel>
      </rss>`;

    const articles = parseRssFeed(xml, source);
    expect(articles[0].subtitle).toBeUndefined();
  });

  it("filters out empty paragraphs after splitting", () => {
    const xml = `<?xml version="1.0"?>
      <rss version="2.0">
        <channel>
          <item>
            <title>Empty Paras</title>
            <link>https://example.com/empty</link>
            <description>&lt;p&gt;&lt;/p&gt;&lt;p&gt;Real content.&lt;/p&gt;&lt;p&gt;  &lt;/p&gt;</description>
          </item>
        </channel>
      </rss>`;

    const articles = parseRssFeed(xml, source);
    expect(articles[0].body).toEqual(["Real content."]);
  });
});
