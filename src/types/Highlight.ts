export interface Highlight {
  id: string;
  articleId: string;
  userId: string;
  paragraphIndex: number;
  startOffset: number;
  endOffset: number;
  highlightedText: string;
  explanation: string;
  isEdited: boolean;
  originalExplanation: string | null;
  createdAt: number;
  updatedAt: number;
}
