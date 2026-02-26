import { Article, AnonymizedArticle } from "../types";
import { anonymize } from "./anonymize";

export class ArticleStore {
  private articles: Map<string, Article> = new Map();

  add(article: Article): void {
    if (!this.articles.has(article.id)) {
      this.articles.set(article.id, article);
    }
  }

  getAnonymized(id: string): AnonymizedArticle | undefined {
    const article = this.articles.get(id);
    if (!article) return undefined;
    return anonymize(article);
  }

  getAllAnonymized(): AnonymizedArticle[] {
    return Array.from(this.articles.values()).map(anonymize);
  }

  get count(): number {
    return this.articles.size;
  }
}
