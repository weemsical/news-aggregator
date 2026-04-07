import { RawArticle } from "../types";

export interface RawArticleRepository {
  save(rawArticle: RawArticle): Promise<void>;
  saveBatch(rawArticles: RawArticle[]): Promise<void>;
  findById(id: string): Promise<RawArticle | undefined>;
  count(): Promise<number>;
}
