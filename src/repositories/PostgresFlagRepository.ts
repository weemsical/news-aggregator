import { Pool } from "pg";
import { PropagandaFlag } from "../types";
import { FlagRepository } from "./FlagRepository";

export class PostgresFlagRepository implements FlagRepository {
  constructor(private pool: Pool) {}

  async save(flag: PropagandaFlag): Promise<void> {
    if (!flag.highlightedText.trim()) {
      throw new Error("highlightedText must not be empty");
    }
    if (!flag.explanation.trim()) {
      throw new Error("explanation must not be empty");
    }

    await this.pool.query(
      `INSERT INTO propaganda_flags (id, article_id, highlighted_text, explanation, timestamp)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (id) DO NOTHING`,
      [
        flag.id,
        flag.articleId,
        flag.highlightedText,
        flag.explanation,
        flag.timestamp,
      ]
    );
  }

  async findAll(): Promise<PropagandaFlag[]> {
    const { rows } = await this.pool.query(
      "SELECT * FROM propaganda_flags ORDER BY timestamp ASC"
    );
    return rows.map((row) => this.toFlag(row));
  }

  async findByArticle(articleId: string): Promise<PropagandaFlag[]> {
    const { rows } = await this.pool.query(
      "SELECT * FROM propaganda_flags WHERE article_id = $1 ORDER BY timestamp ASC",
      [articleId]
    );
    return rows.map((row) => this.toFlag(row));
  }

  async count(): Promise<number> {
    const { rows } = await this.pool.query(
      "SELECT COUNT(*)::int AS count FROM propaganda_flags"
    );
    return rows[0].count;
  }

  private toFlag(row: any): PropagandaFlag {
    return {
      id: row.id,
      articleId: row.article_id,
      highlightedText: row.highlighted_text,
      explanation: row.explanation,
      timestamp: Number(row.timestamp),
    };
  }
}
