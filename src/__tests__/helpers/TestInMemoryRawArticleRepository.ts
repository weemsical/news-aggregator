import { RawArticle } from "@types";
import { RawArticleRepository } from "@repositories";

export class TestInMemoryRawArticleRepository implements RawArticleRepository {
  private rawArticles: Map<string, RawArticle> = new Map();

  async save(rawArticle: RawArticle): Promise<void> {
    if (!this.rawArticles.has(rawArticle.id)) {
      this.rawArticles.set(rawArticle.id, rawArticle);
    }
  }

  async saveBatch(rawArticles: RawArticle[]): Promise<void> {
    for (const rawArticle of rawArticles) {
      await this.save(rawArticle);
    }
  }

  async findById(id: string): Promise<RawArticle | undefined> {
    return this.rawArticles.get(id);
  }

  async findBySource(sourceId: string, limit = 10): Promise<RawArticle[]> {
    return Array.from(this.rawArticles.values())
      .filter((r) => r.sourceId === sourceId)
      .sort((a, b) => b.fetchedAt - a.fetchedAt)
      .slice(0, limit);
  }

  async count(): Promise<number> {
    return this.rawArticles.size;
  }
}
