import { Article } from "@types";

export interface ArticlePage {
  articles: Article[];
  total: number;
}

export interface SourceScoreRow {
  sourceId: string;
  totalScore: number;
  articleCount: number;
}

export interface ArticleRepository {
  save(article: Article): Promise<void>;
  saveBatch(articles: Article[]): Promise<void>;
  findById(id: string): Promise<Article | undefined>;
  findAll(): Promise<Article[]>;
  exists(id: string): Promise<boolean>;
  count(): Promise<number>;
  updateScore(id: string, score: number): Promise<void>;
  findApproved(options?: { from?: number; to?: number }): Promise<Article[]>;
  findApprovedPaged(options: {
    sort: "date" | "propaganda";
    page: number;
    pageSize: number;
  }): Promise<ArticlePage>;
  getScoresBySource(options?: { from?: number; to?: number }): Promise<SourceScoreRow[]>;
}
