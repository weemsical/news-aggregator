import { XMLParser } from "fast-xml-parser";
import { Article } from "@types";
import { FeedSource } from "@data";

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  isArray: (name) => name === "item" || name === "entry" || name === "category",
});

export function parseRssFeed(xml: string, source: FeedSource): Article[] {
  let parsed: any;
  try {
    parsed = parser.parse(xml);
  } catch {
    return [];
  }

  const now = Date.now();

  // RSS 2.0
  if (parsed?.rss?.channel) {
    const items = parsed.rss.channel.item;
    if (!items) return [];
    return parseItems(asArray(items), source, now, "rss");
  }

  // Atom
  if (parsed?.feed) {
    const entries = parsed.feed.entry;
    if (!entries) return [];
    return parseItems(asArray(entries), source, now, "atom");
  }

  return [];
}

function parseItems(
  items: any[],
  source: FeedSource,
  now: number,
  format: "rss" | "atom"
): Article[] {
  const articles: Article[] = [];

  for (const item of items) {
    const title = extractTitle(item, format);
    const url = extractUrl(item, format);
    if (!title || !url) continue;

    const rawDescription = extractDescription(item, format);
    const body = splitIntoParagraphs(rawDescription);
    if (body.length === 0) {
      body.push("");
    }

    const sourceTags = extractTags(item, source);

    const id = generateId(source.sourceId, url);
    articles.push({
      id,
      rawArticleId: id,
      title: decodeEntities(title),
      body,
      sourceTags,
      sourceId: source.sourceId,
      url,
      fetchedAt: now,
      reviewStatus: "approved",
      propagandaScore: 0,
    });
  }

  return articles;
}

function extractTitle(item: any, format: string): string | undefined {
  const raw = item.title;
  if (!raw) return undefined;
  return typeof raw === "string" ? raw.trim() : String(raw).trim();
}

function extractUrl(item: any, format: string): string | undefined {
  if (format === "atom") {
    const link = item.link;
    if (!link) return undefined;
    if (typeof link === "string") return link;
    if (Array.isArray(link)) {
      const alt = link.find((l: any) => l["@_rel"] === "alternate") || link[0];
      return alt?.["@_href"];
    }
    return link["@_href"];
  }
  return item.link ? String(item.link).trim() : undefined;
}

function extractDescription(item: any, format: string): string {
  if (format === "atom") {
    const summary = item.summary;
    const content = item.content;
    const raw = summary || (typeof content === "object" ? content["#text"] : content);
    return raw ? String(raw) : "";
  }
  return item.description ? String(item.description) : "";
}

function extractTags(item: any, source: FeedSource): string[] {
  const categories = item.category;
  if (categories && Array.isArray(categories) && categories.length > 0) {
    return categories
      .map((c: any) => (typeof c === "string" ? c : c["#text"] || String(c)))
      .map((c: string) => c.toLowerCase().trim())
      .filter(Boolean);
  }
  return [...source.defaultTags];
}

function splitIntoParagraphs(html: string): string[] {
  // First, split on <p> and <br> tags
  let text = html;

  // Replace </p><p> and <br> variants with a paragraph separator
  text = text.replace(/<\/p>\s*<p[^>]*>/gi, "\n\n");
  text = text.replace(/<p[^>]*>/gi, "\n\n");
  text = text.replace(/<\/p>/gi, "\n\n");
  text = text.replace(/<br\s*\/?>/gi, "\n\n");

  // Strip remaining HTML tags
  text = text.replace(/<[^>]+>/g, "");

  // Decode HTML entities
  text = decodeEntities(text);

  // Split into paragraphs, trim, filter empty
  return text
    .split(/\n\n+/)
    .map((p) => p.trim())
    .filter(Boolean);
}

function decodeEntities(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&apos;/g, "'");
}

function generateId(sourceId: string, url: string): string {
  // Simple deterministic hash from sourceId + url
  let hash = 0;
  const str = `${sourceId}:${url}`;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash + char) | 0;
  }
  const hex = Math.abs(hash).toString(16);
  return `${sourceId}-${hex}`;
}

function asArray<T>(value: T | T[]): T[] {
  return Array.isArray(value) ? value : [value];
}
