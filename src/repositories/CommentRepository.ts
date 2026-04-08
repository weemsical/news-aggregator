import { Comment } from "@types";

export interface CommentRepository {
  save(comment: Comment): Promise<void>;
  findByHighlight(highlightId: string): Promise<Comment[]>;
  countByHighlight(highlightId: string): Promise<number>;
  findById(id: string): Promise<Comment | undefined>;
  count(): Promise<number>;
}
