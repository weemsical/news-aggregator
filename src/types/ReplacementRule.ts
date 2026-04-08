export interface ReplacementRule {
  id: string;
  sourceId: string;
  pattern: string;
  replacementText: string;
  isRegex: boolean;
  createdAt: number;
  updatedAt: number;
}
