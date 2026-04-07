export interface Article {
  id: string;
  rawArticleId: string;
  title: string;
  subtitle?: string;
  body: string[];
  sourceTags: string[];
  sourceId: string;
  url: string;
  fetchedAt: number;
  reviewStatus: "pending" | "approved" | "rejected";
  propagandaScore: number;
}

export type AnonymizedArticle = Omit<Article, "sourceId" | "url">;
