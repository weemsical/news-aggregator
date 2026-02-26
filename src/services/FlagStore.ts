import { PropagandaFlag } from "../types";

export class FlagStore {
  private flags: Map<string, PropagandaFlag> = new Map();

  add(flag: PropagandaFlag): void {
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

  getAll(): PropagandaFlag[] {
    return Array.from(this.flags.values()).sort(
      (a, b) => a.timestamp - b.timestamp
    );
  }

  getByArticle(articleId: string): PropagandaFlag[] {
    return this.getAll().filter((f) => f.articleId === articleId);
  }

  get count(): number {
    return this.flags.size;
  }
}
