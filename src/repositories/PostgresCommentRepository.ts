import { Pool } from "pg";
import { Comment } from "@types";
import { CommentRepository } from "./CommentRepository";

export class PostgresCommentRepository implements CommentRepository {
  constructor(private pool: Pool) {}

  async save(comment: Comment): Promise<void> {
    await this.pool.query(
      `INSERT INTO comments (id, highlight_id, user_id, text, reply_to_id, created_at)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [comment.id, comment.highlightId, comment.userId, comment.text, comment.replyToId, comment.createdAt]
    );
  }

  async findByHighlight(highlightId: string): Promise<Comment[]> {
    const { rows } = await this.pool.query(
      "SELECT * FROM comments WHERE highlight_id = $1 ORDER BY created_at ASC",
      [highlightId]
    );
    return rows.map((row) => this.toComment(row));
  }

  async countByHighlight(highlightId: string): Promise<number> {
    const { rows } = await this.pool.query(
      "SELECT COUNT(*)::int AS count FROM comments WHERE highlight_id = $1",
      [highlightId]
    );
    return rows[0].count;
  }

  async findById(id: string): Promise<Comment | undefined> {
    const { rows } = await this.pool.query("SELECT * FROM comments WHERE id = $1", [id]);
    return rows.length > 0 ? this.toComment(rows[0]) : undefined;
  }

  async count(): Promise<number> {
    const { rows } = await this.pool.query("SELECT COUNT(*)::int AS count FROM comments");
    return rows[0].count;
  }

  private toComment(row: any): Comment {
    return {
      id: row.id,
      highlightId: row.highlight_id,
      userId: row.user_id,
      text: row.text,
      replyToId: row.reply_to_id ?? null,
      createdAt: Number(row.created_at),
    };
  }
}
