import { Article } from "@types";

export interface ArticleRepository {
  save(article: Article): Promise<void>;
  saveBatch(articles: Article[]): Promise<void>;
  findById(id: string): Promise<Article | undefined>;
  findAll(): Promise<Article[]>;
  exists(id: string): Promise<boolean>;
  count(): Promise<number>;
}
