import { Pool } from "pg";
import { FeedSource } from "../data/feedSources";
import { FeedSourceRepository } from "./FeedSourceRepository";

export class PostgresFeedSourceRepository implements FeedSourceRepository {
  constructor(private pool: Pool) {}

  async save(source: FeedSource): Promise<void> {
    await this.pool.query(
      `INSERT INTO feed_sources (source_id, name, feed_url, default_tags)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (source_id) DO UPDATE SET
         name = EXCLUDED.name,
         feed_url = EXCLUDED.feed_url,
         default_tags = EXCLUDED.default_tags`,
      [
        source.sourceId,
        source.name,
        source.feedUrl,
        JSON.stringify(source.defaultTags),
      ]
    );
  }

  async findAll(): Promise<FeedSource[]> {
    const { rows } = await this.pool.query(
      "SELECT * FROM feed_sources ORDER BY name"
    );
    return rows.map((row) => this.toFeedSource(row));
  }

  async findById(sourceId: string): Promise<FeedSource | undefined> {
    const { rows } = await this.pool.query(
      "SELECT * FROM feed_sources WHERE source_id = $1",
      [sourceId]
    );
    return rows.length > 0 ? this.toFeedSource(rows[0]) : undefined;
  }

  async remove(sourceId: string): Promise<boolean> {
    const { rowCount } = await this.pool.query(
      "DELETE FROM feed_sources WHERE source_id = $1",
      [sourceId]
    );
    return (rowCount ?? 0) > 0;
  }

  async count(): Promise<number> {
    const { rows } = await this.pool.query(
      "SELECT COUNT(*)::int AS count FROM feed_sources"
    );
    return rows[0].count;
  }

  private toFeedSource(row: any): FeedSource {
    return {
      sourceId: row.source_id,
      name: row.name,
      feedUrl: row.feed_url,
      defaultTags: row.default_tags,
    };
  }
}
