import { Highlight } from "@types";
import { HighlightRepository, HighlightClusterRepository } from "@repositories";
import { calculateOverlapPercentage } from "./OverlapService";
import crypto from "crypto";

export class ClusterService {
  constructor(
    private highlightRepo: HighlightRepository,
    private clusterRepo: HighlightClusterRepository,
    private threshold: number = 0.5
  ) {}

  async recalculateClusters(articleId: string, paragraphIndex: number): Promise<void> {
    const allHighlights = await this.highlightRepo.findByArticle(articleId);
    const paragraphHighlights = allHighlights.filter(
      (h) => h.paragraphIndex === paragraphIndex && h.userId !== "anon"
    );

    // Delete existing clusters for this paragraph
    const existingClusters = await this.clusterRepo.findByParagraph(articleId, paragraphIndex);
    for (const cluster of existingClusters) {
      await this.clusterRepo.delete(cluster.id);
    }

    if (paragraphHighlights.length === 0) return;

    // Build clusters using union-find approach
    const clusterMap = new Map<number, number[]>(); // cluster leader index → member indices
    const parent = paragraphHighlights.map((_, i) => i);

    function find(i: number): number {
      while (parent[i] !== i) {
        parent[i] = parent[parent[i]];
        i = parent[i];
      }
      return i;
    }

    function union(a: number, b: number) {
      const ra = find(a);
      const rb = find(b);
      if (ra !== rb) parent[rb] = ra;
    }

    // Compare all pairs, cluster those with >= threshold overlap
    for (let i = 0; i < paragraphHighlights.length; i++) {
      for (let j = i + 1; j < paragraphHighlights.length; j++) {
        const hi = paragraphHighlights[i];
        const hj = paragraphHighlights[j];
        const overlap = calculateOverlapPercentage(
          { start: hi.startOffset, end: hi.endOffset },
          { start: hj.startOffset, end: hj.endOffset }
        );
        if (overlap >= this.threshold) {
          union(i, j);
        }
      }
    }

    // Group by cluster leader
    const groups = new Map<number, Highlight[]>();
    for (let i = 0; i < paragraphHighlights.length; i++) {
      const leader = find(i);
      if (!groups.has(leader)) groups.set(leader, []);
      groups.get(leader)!.push(paragraphHighlights[i]);
    }

    // Save clusters with 2+ members
    const now = Date.now();
    for (const members of groups.values()) {
      if (members.length < 2) continue;
      await this.clusterRepo.save({
        id: crypto.randomUUID(),
        articleId,
        paragraphIndex,
        highlightIds: members.map((h) => h.id),
        agreementCount: members.length,
        createdAt: now,
        updatedAt: now,
      });
    }
  }
}
