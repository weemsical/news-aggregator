import { HighlightCluster } from "@types";
import { HighlightClusterRepository } from "@repositories";

export class TestInMemoryHighlightClusterRepository implements HighlightClusterRepository {
  private clusters: Map<string, HighlightCluster> = new Map();

  async save(cluster: HighlightCluster): Promise<void> {
    this.clusters.set(cluster.id, cluster);
  }

  async update(
    id: string,
    fields: { highlightIds: string[]; agreementCount: number }
  ): Promise<HighlightCluster | undefined> {
    const existing = this.clusters.get(id);
    if (!existing) return undefined;
    const updated: HighlightCluster = {
      ...existing,
      highlightIds: fields.highlightIds,
      agreementCount: fields.agreementCount,
      updatedAt: Date.now(),
    };
    this.clusters.set(id, updated);
    return updated;
  }

  async delete(id: string): Promise<boolean> {
    return this.clusters.delete(id);
  }

  async findByArticle(articleId: string): Promise<HighlightCluster[]> {
    return Array.from(this.clusters.values()).filter(
      (c) => c.articleId === articleId
    );
  }

  async findByParagraph(
    articleId: string,
    paragraphIndex: number
  ): Promise<HighlightCluster[]> {
    return Array.from(this.clusters.values()).filter(
      (c) => c.articleId === articleId && c.paragraphIndex === paragraphIndex
    );
  }

  async count(): Promise<number> {
    return this.clusters.size;
  }
}
