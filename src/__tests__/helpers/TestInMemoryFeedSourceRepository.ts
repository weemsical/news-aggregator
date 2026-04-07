import { FeedSource } from "../../data/feedSources";
import { FeedSourceRepository } from "../../repositories/FeedSourceRepository";

export class TestInMemoryFeedSourceRepository implements FeedSourceRepository {
  private sources: Map<string, FeedSource> = new Map();

  async save(source: FeedSource): Promise<void> {
    this.sources.set(source.sourceId, source);
  }

  async findAll(): Promise<FeedSource[]> {
    return Array.from(this.sources.values());
  }

  async findById(sourceId: string): Promise<FeedSource | undefined> {
    return this.sources.get(sourceId);
  }

  async remove(sourceId: string): Promise<boolean> {
    return this.sources.delete(sourceId);
  }

  async count(): Promise<number> {
    return this.sources.size;
  }
}
