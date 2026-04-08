import { HighlightClusterRepository, VoteRepository, ArticleRepository } from "@repositories";

export class ScoringService {
  constructor(
    private clusterRepo: HighlightClusterRepository,
    private voteRepo: VoteRepository,
    private articleRepo: ArticleRepository
  ) {}

  async calculateArticleScore(articleId: string): Promise<number> {
    const clusters = await this.clusterRepo.findByArticle(articleId);
    if (clusters.length === 0) return 0;

    let totalScore = 0;

    for (const cluster of clusters) {
      let agrees = 0;
      let disagrees = 0;

      for (const highlightId of cluster.highlightIds) {
        const votes = await this.voteRepo.findByHighlight(highlightId);
        for (const vote of votes) {
          if (vote.userId === "anon") continue;
          if (vote.voteType === "agree") agrees++;
          else disagrees++;
        }
      }

      const totalVotes = agrees + disagrees;
      if (totalVotes < 3) continue;

      const uniqueAgreeingUsers = cluster.highlightIds.length;
      const clusterScore = uniqueAgreeingUsers * (agrees / totalVotes);
      totalScore += clusterScore;
    }

    return totalScore;
  }

  async recalculateScore(articleId: string): Promise<void> {
    const score = await this.calculateArticleScore(articleId);
    await this.articleRepo.updateScore(articleId, score);
  }
}
