import { HighlightCluster } from "@types";

export interface HighlightClusterRepository {
  save(cluster: HighlightCluster): Promise<void>;
  update(id: string, fields: { highlightIds: string[]; agreementCount: number }): Promise<HighlightCluster | undefined>;
  delete(id: string): Promise<boolean>;
  findByArticle(articleId: string): Promise<HighlightCluster[]>;
  findByParagraph(articleId: string, paragraphIndex: number): Promise<HighlightCluster[]>;
  count(): Promise<number>;
}
