import { Article } from "@types";
import { ArticleRepository } from "@repositories";

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
    return Array.from(this.articles.values())
      .filter((a) => a.reviewStatus === "approved")
      .sort((a, b) => b.fetchedAt - a.fetchedAt);
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
