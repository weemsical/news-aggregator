import { RawArticle } from "@types";

export interface RawArticleRepository {
  save(rawArticle: RawArticle): Promise<void>;
  saveBatch(rawArticles: RawArticle[]): Promise<void>;
  findById(id: string): Promise<RawArticle | undefined>;
  findBySource(sourceId: string, limit?: number): Promise<RawArticle[]>;
  delete(id: string): Promise<boolean>;
  count(): Promise<number>;
}
