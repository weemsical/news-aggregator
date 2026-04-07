import { Pool } from "pg";
import { Highlight } from "../types";
import { HighlightRepository } from "./HighlightRepository";

export class PostgresHighlightRepository implements HighlightRepository {
  constructor(private pool: Pool) {}

  async save(highlight: Highlight): Promise<void> {
    if (!highlight.highlightedText.trim()) {
      throw new Error("highlightedText must not be empty");
    }
    if (!highlight.explanation.trim()) {
      throw new Error("explanation must not be empty");
    }
    if (highlight.paragraphIndex < 0) {
      throw new Error("paragraphIndex must not be negative");
    }
    if (highlight.startOffset >= highlight.endOffset) {
      throw new Error("startOffset must be less than endOffset");
    }

    await this.pool.query(
      `INSERT INTO highlights (id, article_id, user_id, paragraph_index, start_offset, end_offset, highlighted_text, explanation, is_edited, original_explanation, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       ON CONFLICT (id) DO NOTHING`,
      [
        highlight.id,
        highlight.articleId,
        highlight.userId,
        highlight.paragraphIndex,
        highlight.startOffset,
        highlight.endOffset,
        highlight.highlightedText,
        highlight.explanation,
        highlight.isEdited,
        highlight.originalExplanation,
        highlight.createdAt,
        highlight.updatedAt,
      ]
    );
  }

  async update(
    id: string,
    fields: { explanation: string }
  ): Promise<Highlight | undefined> {
    const { rows } = await this.pool.query(
      `UPDATE highlights
       SET explanation = $2,
           is_edited = true,
           original_explanation = CASE WHEN is_edited = false THEN explanation ELSE original_explanation END,
           updated_at = $3
       WHERE id = $1
       RETURNING *`,
      [id, fields.explanation, Date.now()]
    );
    return rows.length > 0 ? this.toHighlight(rows[0]) : undefined;
  }

  async delete(id: string): Promise<boolean> {
    const { rowCount } = await this.pool.query(
      "DELETE FROM highlights WHERE id = $1",
      [id]
    );
    return (rowCount ?? 0) > 0;
  }

  async findById(id: string): Promise<Highlight | undefined> {
    const { rows } = await this.pool.query(
      "SELECT * FROM highlights WHERE id = $1",
      [id]
    );
    return rows.length > 0 ? this.toHighlight(rows[0]) : undefined;
  }

  async findByArticle(articleId: string): Promise<Highlight[]> {
    const { rows } = await this.pool.query(
      "SELECT * FROM highlights WHERE article_id = $1 ORDER BY paragraph_index ASC, start_offset ASC",
      [articleId]
    );
    return rows.map((row) => this.toHighlight(row));
  }

  async findByArticleAndUser(
    articleId: string,
    userId: string
  ): Promise<Highlight[]> {
    const { rows } = await this.pool.query(
      "SELECT * FROM highlights WHERE article_id = $1 AND user_id = $2 ORDER BY paragraph_index ASC, start_offset ASC",
      [articleId, userId]
    );
    return rows.map((row) => this.toHighlight(row));
  }

  async count(): Promise<number> {
    const { rows } = await this.pool.query(
      "SELECT COUNT(*)::int AS count FROM highlights"
    );
    return rows[0].count;
  }

  private toHighlight(row: any): Highlight {
    return {
      id: row.id,
      articleId: row.article_id,
      userId: row.user_id,
      paragraphIndex: row.paragraph_index,
      startOffset: row.start_offset,
      endOffset: row.end_offset,
      highlightedText: row.highlighted_text,
      explanation: row.explanation,
      isEdited: row.is_edited,
      originalExplanation: row.original_explanation ?? null,
      createdAt: Number(row.created_at),
      updatedAt: Number(row.updated_at),
    };
  }
}
