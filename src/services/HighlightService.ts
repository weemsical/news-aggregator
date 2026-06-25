import { HighlightRepository } from "@repositories";
import { Highlight } from "@types";
import { ClusterService } from "./ClusterService";
import { ScoringService } from "./ScoringService";

export class HighlightService {
  constructor(
    private highlightRepo: HighlightRepository,
    private clusterService: ClusterService,
    private scoringService: ScoringService
  ) {}

  async createHighlight(highlight: Highlight): Promise<void> {
    await this.highlightRepo.save(highlight);

    if (highlight.userId !== "anon") {
      await this.clusterService.recalculateClusters(highlight.articleId, highlight.paragraphIndex);
      await this.scoringService.recalculateScore(highlight.articleId);
    }
  }

  async deleteHighlight(id: string): Promise<boolean> {
    const highlight = await this.highlightRepo.findById(id);
    if (!highlight) return false;

    const deleted = await this.highlightRepo.delete(id);
    if (deleted) {
      await this.clusterService.recalculateClusters(highlight.articleId, highlight.paragraphIndex);
      await this.scoringService.recalculateScore(highlight.articleId);
    }
    return deleted;
  }
}
