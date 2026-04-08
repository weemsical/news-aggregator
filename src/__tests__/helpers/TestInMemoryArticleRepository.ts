import { Article } from "@types";
import { ArticleRepository, ArticlePage, SourceScoreRow } from "@repositories";

export class TestInMemoryArticleRepository implements ArticleRepository {
  private articles: Map<string, Article> = new Map();

  async save(article: Article): Promise<void> {
    if (!this.articles.has(article.id)) {
      this.articles.set(article.id, article);
    }
  }

  async saveBatch(articles: Article[]): Promise<void> {
    for (const article of articles) {
      await this.save(article);
    }
  }

  async findById(id: string): Promise<Article | undefined> {
    return this.articles.get(id);
  }

  async findAll(): Promise<Article[]> {
    return this.findApproved();
  }

  async exists(id: string): Promise<boolean> {
    return this.articles.has(id);
  }

  async findApproved(options?: { from?: number; to?: number }): Promise<Article[]> {
    return Array.from(this.articles.values())
      .filter((a) => {
        if (a.reviewStatus !== "approved") return false;
        if (options?.from != null && a.fetchedAt < options.from) return false;
        if (options?.to != null && a.fetchedAt > options.to) return false;
        return true;
      })
      .sort((a, b) => b.fetchedAt - a.fetchedAt);
  }

  async findApprovedPaged(options: {
    sort: "date" | "propaganda";
    page: number;
    pageSize: number;
  }): Promise<ArticlePage> {
    const all = await this.findApproved();
    all.sort((a, b) => {
      if (options.sort === "propaganda") {
        const diff = b.propagandaScore - a.propagandaScore;
        if (diff !== 0) return diff;
      }
      return b.fetchedAt - a.fetchedAt;
    });
    const offset = (options.page - 1) * options.pageSize;
    return {
      articles: all.slice(offset, offset + options.pageSize),
      total: all.length,
    };
  }

  async getScoresBySource(options?: { from?: number; to?: number }): Promise<SourceScoreRow[]> {
    const approved = await this.findApproved(options);
    const map = new Map<string, { totalScore: number; articleCount: number }>();
    for (const a of approved) {
      const entry = map.get(a.sourceId) || { totalScore: 0, articleCount: 0 };
      entry.totalScore += a.propagandaScore;
      entry.articleCount++;
      map.set(a.sourceId, entry);
    }
    return Array.from(map.entries())
      .map(([sourceId, data]) => ({ sourceId, ...data }))
      .sort((a, b) => b.totalScore - a.totalScore);
  }

  async findByReviewStatus(status: string): Promise<Article[]> {
    return Array.from(this.articles.values())
      .filter((a) => a.reviewStatus === status)
      .sort((a, b) => b.fetchedAt - a.fetchedAt);
  }

  async updateReviewStatus(id: string, status: string): Promise<Article | undefined> {
    const article = this.articles.get(id);
    if (!article) return undefined;
    const updated = { ...article, reviewStatus: status as Article["reviewStatus"] };
    this.articles.set(id, updated);
    return updated;
  }

  async updateScore(id: string, score: number): Promise<void> {
    const article = this.articles.get(id);
    if (article) {
      this.articles.set(id, { ...article, propagandaScore: score });
    }
  }

  async count(): Promise<number> {
    return this.articles.size;
  }
}
