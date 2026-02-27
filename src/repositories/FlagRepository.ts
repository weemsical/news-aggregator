import { PropagandaFlag } from "../types";

export interface FlagRepository {
  save(flag: PropagandaFlag): Promise<void>;
  findAll(): Promise<PropagandaFlag[]>;
  findByArticle(articleId: string): Promise<PropagandaFlag[]>;
  findByArticleAndUser(articleId: string, userId: string): Promise<PropagandaFlag[]>;
  count(): Promise<number>;
}
