import { FeedSourceRepository } from "@repositories";
import { FeedSource, getAllFeedSources } from "@data";

export interface CreateFeedSourceParams {
  sourceId: unknown;
  name: unknown;
  feedUrl: unknown;
  defaultTags?: unknown;
  publishMode?: unknown;
}

export type EnrichedFeedSource = FeedSource & { isDynamic: boolean };

export type CreateFeedSourceResult =
  | { ok: true; source: FeedSource }
  | { ok: false; status: number; error: string };

export class FeedSourceService {
  constructor(private repo: FeedSourceRepository) {}

  async listEnriched(): Promise<EnrichedFeedSource[]> {
    const all = await getAllFeedSources(this.repo);
    const dbSources = await this.repo.findAll();
    const dbSourceIds = new Set(dbSources.map((s) => s.sourceId));
    return all.map((s) => ({ ...s, isDynamic: dbSourceIds.has(s.sourceId) }));
  }

  async findById(sourceId: string): Promise<FeedSource | undefined> {
    const all = await getAllFeedSources(this.repo);
    return all.find((s) => s.sourceId === sourceId);
  }

  async create(params: CreateFeedSourceParams): Promise<CreateFeedSourceResult> {
    const { sourceId, name, feedUrl, defaultTags, publishMode } = params;

    if (!sourceId || !String(sourceId).trim()) {
      return { ok: false, status: 400, error: "sourceId is required" };
    }
    if (!name || !String(name).trim()) {
      return { ok: false, status: 400, error: "name is required" };
    }
    if (!feedUrl || !String(feedUrl).trim()) {
      return { ok: false, status: 400, error: "feedUrl is required" };
    }

    const source: FeedSource = {
      sourceId: String(sourceId).trim(),
      name: String(name).trim(),
      feedUrl: String(feedUrl).trim(),
      defaultTags: Array.isArray(defaultTags) ? defaultTags.map(String) : [],
      publishMode: publishMode === "manual" ? "manual" : "auto",
    };

    await this.repo.save(source);
    return { ok: true, source };
  }

  async updatePublishMode(sourceId: string, publishMode: unknown): Promise<FeedSource | null> {
    const all = await getAllFeedSources(this.repo);
    const existing = all.find((s) => s.sourceId === sourceId);
    if (!existing) {
      return null;
    }

    const updated: FeedSource = {
      ...existing,
      publishMode: publishMode === "manual" ? "manual" : existing.publishMode ?? "auto",
    };
    await this.repo.save(updated);
    return updated;
  }

  async remove(sourceId: string): Promise<boolean> {
    return this.repo.remove(sourceId);
  }
}
