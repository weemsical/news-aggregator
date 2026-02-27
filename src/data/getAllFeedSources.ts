import { FeedSource, feedSources } from "./feedSources";
import { FeedSourceRepository } from "../repositories/FeedSourceRepository";

export async function getAllFeedSources(
  repo: FeedSourceRepository
): Promise<FeedSource[]> {
  const dbSources = await repo.findAll();
  const merged = new Map<string, FeedSource>();

  for (const source of feedSources) {
    merged.set(source.sourceId, source);
  }

  for (const source of dbSources) {
    merged.set(source.sourceId, source);
  }

  return Array.from(merged.values());
}
