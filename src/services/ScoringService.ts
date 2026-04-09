import { HighlightClusterRepository, VoteRepository, ArticleRepository, HighlightRepository } from "@repositories";

export class ScoringService {
  constructor(
    private clusterRepo: HighlightClusterRepository,
    private voteRepo: VoteRepository,
    private articleRepo: ArticleRepository,
    private highlightRepo: HighlightRepository
  ) {}

  async calculateArticleScore(articleId: string): Promise<number> {
    const clusters = await this.clusterRepo.findByArticle(articleId);
    if (clusters.length === 0) return 0;

    const allHighlightIds = clusters.flatMap((c) => c.highlightIds);
    const allVotes = await this.voteRepo.findByHighlights(allHighlightIds);

    // Build highlight → userId map for unique user counting
    const allHighlights = await this.highlightRepo.findByArticle(articleId);
    const highlightUserMap = new Map<string, string>();
    for (const h of allHighlights) {
      highlightUserMap.set(h.id, h.userId);
    }

    // Group votes by highlight ID
    const votesByHighlight = new Map<string, typeof allVotes>();
    for (const vote of allVotes) {
      if (vote.userId === "anon") continue;
      const list = votesByHighlight.get(vote.highlightId) || [];
      list.push(vote);
      votesByHighlight.set(vote.highlightId, list);
    }

    let totalScore = 0;

    for (const cluster of clusters) {
      let agrees = 0;
      let disagrees = 0;

      for (const highlightId of cluster.highlightIds) {
        const votes = votesByHighlight.get(highlightId) || [];
        for (const vote of votes) {
          if (vote.voteType === "agree") agrees++;
          else disagrees++;
        }
      }

      const totalVotes = agrees + disagrees;
      if (totalVotes < 3) continue;

      const uniqueUsers = new Set(
        cluster.highlightIds.map((id) => highlightUserMap.get(id)).filter(Boolean)
      ).size;
      const clusterScore = uniqueUsers * (agrees / totalVotes);
      totalScore += clusterScore;
    }

    return totalScore;
  }

  async recalculateScore(articleId: string): Promise<void> {
    const score = await this.calculateArticleScore(articleId);
    await this.articleRepo.updateScore(articleId, score);
  }
}
