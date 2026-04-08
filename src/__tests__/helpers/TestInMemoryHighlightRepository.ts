import { Highlight } from "../../types";
import { HighlightRepository } from "../../repositories/HighlightRepository";

export class TestInMemoryHighlightRepository implements HighlightRepository {
  private highlights: Map<string, Highlight> = new Map();

  async save(highlight: Highlight): Promise<void> {
    if (!highlight.highlightedText.trim()) {
      throw new Error("highlightedText must not be empty");
    }
    if (highlight.userId !== "anon" && !highlight.explanation.trim()) {
      throw new Error("explanation must not be empty");
    }
    if (highlight.paragraphIndex < 0) {
      throw new Error("paragraphIndex must not be negative");
    }
    if (highlight.startOffset >= highlight.endOffset) {
      throw new Error("startOffset must be less than endOffset");
    }
    if (!this.highlights.has(highlight.id)) {
      this.highlights.set(highlight.id, highlight);
    }
  }

  async update(
    id: string,
    fields: { explanation: string }
  ): Promise<Highlight | undefined> {
    const existing = this.highlights.get(id);
    if (!existing) return undefined;

    const updated: Highlight = {
      ...existing,
      originalExplanation: existing.isEdited
        ? existing.originalExplanation
        : existing.explanation,
      explanation: fields.explanation,
      isEdited: true,
      updatedAt: Date.now(),
    };
    this.highlights.set(id, updated);
    return updated;
  }

  async delete(id: string): Promise<boolean> {
    return this.highlights.delete(id);
  }

  async findById(id: string): Promise<Highlight | undefined> {
    return this.highlights.get(id);
  }

  async findByArticle(articleId: string): Promise<Highlight[]> {
    return Array.from(this.highlights.values())
      .filter((h) => h.articleId === articleId)
      .sort(
        (a, b) =>
          a.paragraphIndex - b.paragraphIndex || a.startOffset - b.startOffset
      );
  }

  async findByArticleAndUser(
    articleId: string,
    userId: string
  ): Promise<Highlight[]> {
    return Array.from(this.highlights.values())
      .filter((h) => h.articleId === articleId && h.userId === userId)
      .sort(
        (a, b) =>
          a.paragraphIndex - b.paragraphIndex || a.startOffset - b.startOffset
      );
  }

  async count(): Promise<number> {
    return this.highlights.size;
  }
}
