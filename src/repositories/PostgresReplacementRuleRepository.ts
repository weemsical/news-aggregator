import { Pool } from "pg";
import { ReplacementRule } from "@types";
import { ReplacementRuleRepository } from "./ReplacementRuleRepository";
import { ReplacementRuleRow } from "./dbRowTypes";

export class PostgresReplacementRuleRepository implements ReplacementRuleRepository {
  constructor(private pool: Pool) {}

  async save(rule: ReplacementRule): Promise<void> {
    await this.pool.query(
      `INSERT INTO replacement_rules (id, source_id, pattern, replacement_text, is_regex, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (id) DO NOTHING`,
      [rule.id, rule.sourceId, rule.pattern, rule.replacementText, rule.isRegex, rule.createdAt, rule.updatedAt]
    );
  }

  async update(rule: ReplacementRule): Promise<void> {
    await this.pool.query(
      `UPDATE replacement_rules SET pattern = $1, replacement_text = $2, is_regex = $3, updated_at = $4
       WHERE id = $5`,
      [rule.pattern, rule.replacementText, rule.isRegex, rule.updatedAt, rule.id]
    );
  }

  async delete(id: string): Promise<boolean> {
    const { rowCount } = await this.pool.query(
      "DELETE FROM replacement_rules WHERE id = $1",
      [id]
    );
    return (rowCount ?? 0) > 0;
  }

  async findBySource(sourceId: string): Promise<ReplacementRule[]> {
    const { rows } = await this.pool.query(
      "SELECT * FROM replacement_rules WHERE source_id = $1 ORDER BY created_at",
      [sourceId]
    );
    return rows.map((row) => this.toRule(row));
  }

  async findById(id: string): Promise<ReplacementRule | undefined> {
    const { rows } = await this.pool.query(
      "SELECT * FROM replacement_rules WHERE id = $1",
      [id]
    );
    return rows.length > 0 ? this.toRule(rows[0]) : undefined;
  }

  private toRule(row: ReplacementRuleRow): ReplacementRule {
    return {
      id: row.id,
      sourceId: row.source_id,
      pattern: row.pattern,
      replacementText: row.replacement_text,
      isRegex: row.is_regex,
      createdAt: Number(row.created_at),
      updatedAt: Number(row.updated_at),
    };
  }
}
