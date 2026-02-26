import { anonymize } from "../services/anonymize";
import { seedArticles } from "../data/seedArticles";
import { Article, AnonymizedArticle } from "../types";

export async function loadArticles(): Promise<AnonymizedArticle[]> {
  let fetchedArticles: Article[] = [];

  try {
    const response = await fetch("/articles.json");
    if (response.ok) {
      const data = await response.json();
      if (Array.isArray(data)) {
        fetchedArticles = data;
      }
    }
  } catch {
    // Fetch failed — fall through to seed data only
  }

  // Count how many fetched articles per source
  const fetchedPerSource = new Map<string, number>();
  for (const a of fetchedArticles) {
    fetchedPerSource.set(a.sourceId, (fetchedPerSource.get(a.sourceId) || 0) + 1);
  }

  // For each source with fetched articles, drop one seed from that source
  const droppedPerSource = new Map<string, number>();
  const seeds = seedArticles.filter((s) => {
    const fetchedCount = fetchedPerSource.get(s.sourceId) || 0;
    const droppedCount = droppedPerSource.get(s.sourceId) || 0;
    if (fetchedCount > 0 && droppedCount < 1) {
      droppedPerSource.set(s.sourceId, droppedCount + 1);
      return false;
    }
    return true;
  });

  // Fetched articles on top, remaining seeds underneath
  const combined = [...fetchedArticles, ...seeds];

  // Deduplicate by id, preserving order
  const seen = new Set<string>();
  const unique = combined.filter((a) => {
    if (seen.has(a.id)) return false;
    seen.add(a.id);
    return true;
  });

  return unique.map(anonymize);
}
