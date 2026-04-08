import { Pool } from "pg";
import { RawArticle } from "@types";
import { RawArticleRepository } from "./RawArticleRepository";

export class PostgresRawArticleRepository implements RawArticleRepository {
  constructor(private pool: Pool) {}

  async save(rawArticle: RawArticle): Promise<void> {
    await this.pool.query(
      `INSERT INTO raw_articles (id, title, body, source_id, url, fetched_at)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (id) DO NOTHING`,
      [
        rawArticle.id,
        rawArticle.title,
        JSON.stringify(rawArticle.body),
        rawArticle.sourceId,
        rawArticle.url,
        rawArticle.fetchedAt,
      ]
    );
  }

  async saveBatch(rawArticles: RawArticle[]): Promise<void> {
    for (const rawArticle of rawArticles) {
      await this.save(rawArticle);
    }
  }

  async findById(id: string): Promise<RawArticle | undefined> {
    const { rows } = await this.pool.query(
      "SELECT * FROM raw_articles WHERE id = $1",
      [id]
    );
    return rows.length > 0 ? this.toRawArticle(rows[0]) : undefined;
  }

  async count(): Promise<number> {
    const { rows } = await this.pool.query(
      "SELECT COUNT(*)::int AS count FROM raw_articles"
    );
    return rows[0].count;
  }

  private toRawArticle(row: any): RawArticle {
    return {
      id: row.id,
      title: row.title,
      body: row.body,
      sourceId: row.source_id,
      url: row.url,
      fetchedAt: Number(row.fetched_at),
    };
  }
}
