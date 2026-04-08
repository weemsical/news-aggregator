import { Comment } from "@types";
import { CommentRepository } from "@repositories";

export class TestInMemoryCommentRepository implements CommentRepository {
  private comments: Map<string, Comment> = new Map();

  async save(comment: Comment): Promise<void> {
    this.comments.set(comment.id, comment);
  }

  async findByHighlight(highlightId: string): Promise<Comment[]> {
    return Array.from(this.comments.values())
      .filter((c) => c.highlightId === highlightId)
      .sort((a, b) => a.createdAt - b.createdAt);
  }

  async countByHighlight(highlightId: string): Promise<number> {
    return Array.from(this.comments.values()).filter(
      (c) => c.highlightId === highlightId
    ).length;
  }

  async findById(id: string): Promise<Comment | undefined> {
    return this.comments.get(id);
  }

  async count(): Promise<number> {
    return this.comments.size;
  }
}
