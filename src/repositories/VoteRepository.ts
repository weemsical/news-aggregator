import { Vote } from "@types";

export interface VoteCounts {
  agrees: number;
  disagrees: number;
}

export interface VoteRepository {
  save(vote: Vote): Promise<void>;
  update(id: string, fields: { voteType: "agree" | "disagree"; reason?: string | null }): Promise<Vote | undefined>;
  findById(id: string): Promise<Vote | undefined>;
  findByHighlight(highlightId: string): Promise<Vote[]>;
  findByHighlightAndUser(highlightId: string, userId: string): Promise<Vote | undefined>;
  countByHighlight(highlightId: string): Promise<VoteCounts>;
  findByHighlights(highlightIds: string[]): Promise<Vote[]>;
  count(): Promise<number>;
}
