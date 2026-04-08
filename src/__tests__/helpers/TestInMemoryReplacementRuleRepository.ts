import { ReplacementRule } from "@types";
import { ReplacementRuleRepository } from "@repositories";

export class TestInMemoryReplacementRuleRepository implements ReplacementRuleRepository {
  private rules: Map<string, ReplacementRule> = new Map();

  async save(rule: ReplacementRule): Promise<void> {
    if (!this.rules.has(rule.id)) {
      this.rules.set(rule.id, rule);
    }
  }

  async update(rule: ReplacementRule): Promise<void> {
    if (this.rules.has(rule.id)) {
      this.rules.set(rule.id, rule);
    }
  }

  async delete(id: string): Promise<boolean> {
    return this.rules.delete(id);
  }

  async findBySource(sourceId: string): Promise<ReplacementRule[]> {
    return Array.from(this.rules.values())
      .filter((r) => r.sourceId === sourceId)
      .sort((a, b) => a.createdAt - b.createdAt);
  }

  async findById(id: string): Promise<ReplacementRule | undefined> {
    return this.rules.get(id);
  }
}
