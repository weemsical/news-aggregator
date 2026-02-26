export interface Article {
  id: string;
  title: string;
  subtitle?: string;
  body: string[];
  sourceTags: string[];
  sourceId: string;
  url: string;
  fetchedAt: number;
}

export type AnonymizedArticle = Omit<Article, "sourceId" | "url">;
