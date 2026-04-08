import { ReplacementRule } from "@types";

export interface ReplacementRuleRepository {
  save(rule: ReplacementRule): Promise<void>;
  update(rule: ReplacementRule): Promise<void>;
  delete(id: string): Promise<boolean>;
  findBySource(sourceId: string): Promise<ReplacementRule[]>;
  findById(id: string): Promise<ReplacementRule | undefined>;
}
