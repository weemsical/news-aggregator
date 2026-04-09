import { Pool } from "pg";
import { HighlightCluster } from "@types";
import { HighlightClusterRepository } from "./HighlightClusterRepository";
import { HighlightClusterRow } from "./dbRowTypes";

export class PostgresHighlightClusterRepository implements HighlightClusterRepository {
  constructor(private pool: Pool) {}

  async save(cluster: HighlightCluster): Promise<void> {
    await this.pool.query(
      `INSERT INTO highlight_clusters (id, article_id, paragraph_index, highlight_ids, agreement_count, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        cluster.id,
        cluster.articleId,
        cluster.paragraphIndex,
        JSON.stringify(cluster.highlightIds),
        cluster.agreementCount,
        cluster.createdAt,
        cluster.updatedAt,
      ]
    );
  }

  async update(
    id: string,
    fields: { highlightIds: string[]; agreementCount: number }
  ): Promise<HighlightCluster | undefined> {
    const { rows } = await this.pool.query(
      `UPDATE highlight_clusters
       SET highlight_ids = $2, agreement_count = $3, updated_at = $4
       WHERE id = $1 RETURNING *`,
      [id, JSON.stringify(fields.highlightIds), fields.agreementCount, Date.now()]
    );
    return rows.length > 0 ? this.toCluster(rows[0]) : undefined;
  }

  async delete(id: string): Promise<boolean> {
    const { rowCount } = await this.pool.query(
      "DELETE FROM highlight_clusters WHERE id = $1",
      [id]
    );
    return (rowCount ?? 0) > 0;
  }

  async findByArticle(articleId: string): Promise<HighlightCluster[]> {
    const { rows } = await this.pool.query(
      "SELECT * FROM highlight_clusters WHERE article_id = $1 ORDER BY paragraph_index ASC",
      [articleId]
    );
    return rows.map((row) => this.toCluster(row));
  }

  async findByParagraph(articleId: string, paragraphIndex: number): Promise<HighlightCluster[]> {
    const { rows } = await this.pool.query(
      "SELECT * FROM highlight_clusters WHERE article_id = $1 AND paragraph_index = $2",
      [articleId, paragraphIndex]
    );
    return rows.map((row) => this.toCluster(row));
  }

  async count(): Promise<number> {
    const { rows } = await this.pool.query(
      "SELECT COUNT(*)::int AS count FROM highlight_clusters"
    );
    return rows[0].count;
  }

  private toCluster(row: HighlightClusterRow): HighlightCluster {
    return {
      id: row.id,
      articleId: row.article_id,
      paragraphIndex: row.paragraph_index,
      highlightIds: typeof row.highlight_ids === "string" ? JSON.parse(row.highlight_ids) : row.highlight_ids,
      agreementCount: row.agreement_count,
      createdAt: Number(row.created_at),
      updatedAt: Number(row.updated_at),
    };
  }
}
