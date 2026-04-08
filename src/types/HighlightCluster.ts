export interface HighlightCluster {
  id: string;
  articleId: string;
  paragraphIndex: number;
  highlightIds: string[];
  agreementCount: number;
  createdAt: number;
  updatedAt: number;
}
