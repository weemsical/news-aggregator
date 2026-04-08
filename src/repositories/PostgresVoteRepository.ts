import { Pool } from "pg";
import { Vote } from "@types";
import { VoteRepository, VoteCounts } from "./VoteRepository";

export class PostgresVoteRepository implements VoteRepository {
  constructor(private pool: Pool) {}

  async save(vote: Vote): Promise<void> {
    await this.pool.query(
      `INSERT INTO votes (id, highlight_id, user_id, vote_type, reason, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (id) DO NOTHING`,
      [vote.id, vote.highlightId, vote.userId, vote.voteType, vote.reason, vote.createdAt, vote.updatedAt]
    );
  }

  async update(
    id: string,
    fields: { voteType: "agree" | "disagree"; reason?: string | null }
  ): Promise<Vote | undefined> {
    const { rows } = await this.pool.query(
      `UPDATE votes SET vote_type = $2, reason = $3, updated_at = $4 WHERE id = $1 RETURNING *`,
      [id, fields.voteType, fields.reason !== undefined ? fields.reason : null, Date.now()]
    );
    return rows.length > 0 ? this.toVote(rows[0]) : undefined;
  }

  async findById(id: string): Promise<Vote | undefined> {
    const { rows } = await this.pool.query("SELECT * FROM votes WHERE id = $1", [id]);
    return rows.length > 0 ? this.toVote(rows[0]) : undefined;
  }

  async findByHighlight(highlightId: string): Promise<Vote[]> {
    const { rows } = await this.pool.query(
      "SELECT * FROM votes WHERE highlight_id = $1 ORDER BY created_at ASC",
      [highlightId]
    );
    return rows.map((row) => this.toVote(row));
  }

  async findByHighlightAndUser(highlightId: string, userId: string): Promise<Vote | undefined> {
    const { rows } = await this.pool.query(
      "SELECT * FROM votes WHERE highlight_id = $1 AND user_id = $2",
      [highlightId, userId]
    );
    return rows.length > 0 ? this.toVote(rows[0]) : undefined;
  }

  async findByHighlights(highlightIds: string[]): Promise<Vote[]> {
    if (highlightIds.length === 0) return [];
    const placeholders = highlightIds.map((_, i) => `$${i + 1}`).join(", ");
    const { rows } = await this.pool.query(
      `SELECT * FROM votes WHERE highlight_id IN (${placeholders}) ORDER BY created_at ASC`,
      highlightIds
    );
    return rows.map((row) => this.toVote(row));
  }

  async countByHighlight(highlightId: string): Promise<VoteCounts> {
    const { rows } = await this.pool.query(
      `SELECT
         COUNT(*) FILTER (WHERE vote_type = 'agree')::int AS agrees,
         COUNT(*) FILTER (WHERE vote_type = 'disagree')::int AS disagrees
       FROM votes WHERE highlight_id = $1`,
      [highlightId]
    );
    return { agrees: rows[0].agrees, disagrees: rows[0].disagrees };
  }

  async count(): Promise<number> {
    const { rows } = await this.pool.query("SELECT COUNT(*)::int AS count FROM votes");
    return rows[0].count;
  }

  private toVote(row: any): Vote {
    return {
      id: row.id,
      highlightId: row.highlight_id,
      userId: row.user_id,
      voteType: row.vote_type,
      reason: row.reason ?? null,
      createdAt: Number(row.created_at),
      updatedAt: Number(row.updated_at),
    };
  }
}
