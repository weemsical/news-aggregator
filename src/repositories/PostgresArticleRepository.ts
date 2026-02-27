import { Pool } from "pg";
import { Article } from "../types";
import { ArticleRepository } from "./ArticleRepository";

export class PostgresArticleRepository implements ArticleRepository {
  constructor(private pool: Pool) {}

  async save(article: Article): Promise<void> {
    await this.pool.query(
      `INSERT INTO articles (id, title, subtitle, body, source_tags, source_id, url, fetched_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (id) DO NOTHING`,
      [
        article.id,
        article.title,
        article.subtitle ?? null,
        JSON.stringify(article.body),
        JSON.stringify(article.sourceTags),
        article.sourceId,
        article.url,
        article.fetchedAt,
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
      "SELECT * FROM articles ORDER BY fetched_at DESC"
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

  async count(): Promise<number> {
    const { rows } = await this.pool.query("SELECT COUNT(*)::int AS count FROM articles");
    return rows[0].count;
  }

  private toArticle(row: any): Article {
    return {
      id: row.id,
      title: row.title,
      subtitle: row.subtitle ?? undefined,
      body: row.body,
      sourceTags: row.source_tags,
      sourceId: row.source_id,
      url: row.url,
      fetchedAt: Number(row.fetched_at),
    };
  }
}
