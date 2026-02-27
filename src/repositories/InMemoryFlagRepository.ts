import { PropagandaFlag } from "../types";
import { FlagRepository } from "./FlagRepository";

export class InMemoryFlagRepository implements FlagRepository {
  private flags: Map<string, PropagandaFlag> = new Map();

  async save(flag: PropagandaFlag): Promise<void> {
    if (!flag.highlightedText.trim()) {
      throw new Error("highlightedText must not be empty");
    }
    if (!flag.explanation.trim()) {
      throw new Error("explanation must not be empty");
    }
    if (!this.flags.has(flag.id)) {
      this.flags.set(flag.id, flag);
    }
  }

  async findAll(): Promise<PropagandaFlag[]> {
    return Array.from(this.flags.values()).sort(
      (a, b) => a.timestamp - b.timestamp
    );
  }

  async findByArticle(articleId: string): Promise<PropagandaFlag[]> {
    return Array.from(this.flags.values())
      .filter((f) => f.articleId === articleId)
      .sort((a, b) => a.timestamp - b.timestamp);
  }

  async count(): Promise<number> {
    return this.flags.size;
  }
}
