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

  async count(): Promise<number> {
    return this.articles.size;
  }
}
