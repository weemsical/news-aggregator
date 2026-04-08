import { Highlight } from "@types";

export interface HighlightRepository {
  save(highlight: Highlight): Promise<void>;
  update(id: string, fields: { explanation: string }): Promise<Highlight | undefined>;
  delete(id: string): Promise<boolean>;
  findById(id: string): Promise<Highlight | undefined>;
  findByArticle(articleId: string): Promise<Highlight[]>;
  findByArticleAndUser(articleId: string, userId: string): Promise<Highlight[]>;
  count(): Promise<number>;
}
