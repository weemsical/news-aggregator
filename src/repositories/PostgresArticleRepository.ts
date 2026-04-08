import { Pool } from "pg";
import { Article } from "@types";
import { ArticleRepository } from "./ArticleRepository";

export class PostgresArticleRepository implements ArticleRepository {
  constructor(private pool: Pool) {}

  async save(article: Article): Promise<void> {
    await this.pool.query(
      `INSERT INTO articles (id, raw_article_id, title, subtitle, body, source_tags, source_id, url, fetched_at, review_status, propaganda_score)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       ON CONFLICT (id) DO NOTHING`,
      [
        article.id,
        article.rawArticleId,
        article.title,
        article.subtitle ?? null,
        JSON.stringify(article.body),
        JSON.stringify(article.sourceTags),
        article.sourceId,
        article.url,
        article.fetchedAt,
        article.reviewStatus,
        article.propagandaScore,
      ]
    );
  }

  async saveBatch(articles: Article[]): Promise<void> {
    for (const article of articles) {
      await this.save(article);
    }
  }

  async findById(id: string): Promise<Article | undefined> {
    const { rows } = await this.pool.query(
      "SELECT * FROM articles WHERE id = $1",
      [id]
    );
    return rows.length > 0 ? this.toArticle(rows[0]) : undefined;
  }

  async findAll(): Promise<Article[]> {
    const { rows } = await this.pool.query(
      "SELECT * FROM articles WHERE review_status = 'approved' ORDER BY fetched_at DESC"
    );
    return rows.map((row) => this.toArticle(row));
  }

  async exists(id: string): Promise<boolean> {
    const { rows } = await this.pool.query(
      "SELECT 1 FROM articles WHERE id = $1",
      [id]
    );
    return rows.length > 0;
  }

  async findApproved(options?: { from?: number; to?: number }): Promise<Article[]> {
    const conditions = ["review_status = 'approved'"];
    const params: any[] = [];
    let paramIndex = 1;

    if (options?.from != null) {
      conditions.push(`fetched_at >= $${paramIndex}`);
      params.push(options.from);
      paramIndex++;
    }
    if (options?.to != null) {
      conditions.push(`fetched_at <= $${paramIndex}`);
      params.push(options.to);
      paramIndex++;
    }

    const { rows } = await this.pool.query(
      `SELECT * FROM articles WHERE ${conditions.join(" AND ")} ORDER BY fetched_at DESC`,
      params
    );
    return rows.map((row) => this.toArticle(row));
  }

  async updateScore(id: string, score: number): Promise<void> {
    await this.pool.query(
      "UPDATE articles SET propaganda_score = $1 WHERE id = $2",
      [score, id]
    );
  }

  async count(): Promise<number> {
    const { rows } = await this.pool.query("SELECT COUNT(*)::int AS count FROM articles");
    return rows[0].count;
  }

  private toArticle(row: any): Article {
    return {
      id: row.id,
      rawArticleId: row.raw_article_id,
      title: row.title,
      subtitle: row.subtitle ?? undefined,
      body: row.body,
      sourceTags: row.source_tags,
      sourceId: row.source_id,
      url: row.url,
      fetchedAt: Number(row.fetched_at),
      reviewStatus: row.review_status,
      propagandaScore: Number(row.propaganda_score),
    };
  }
}
