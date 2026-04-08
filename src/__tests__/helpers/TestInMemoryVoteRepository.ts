import { Vote } from "@types";
import { VoteRepository, VoteCounts } from "@repositories";

export class TestInMemoryVoteRepository implements VoteRepository {
  private votes: Map<string, Vote> = new Map();

  async save(vote: Vote): Promise<void> {
    this.votes.set(vote.id, vote);
  }

  async update(
    id: string,
    fields: { voteType: "agree" | "disagree"; reason?: string | null }
  ): Promise<Vote | undefined> {
    const existing = this.votes.get(id);
    if (!existing) return undefined;
    const updated: Vote = {
      ...existing,
      voteType: fields.voteType,
      reason: fields.reason !== undefined ? fields.reason : existing.reason,
      updatedAt: Date.now(),
    };
    this.votes.set(id, updated);
    return updated;
  }

  async findById(id: string): Promise<Vote | undefined> {
    return this.votes.get(id);
  }

  async findByHighlight(highlightId: string): Promise<Vote[]> {
    return Array.from(this.votes.values()).filter(
      (v) => v.highlightId === highlightId
    );
  }

  async findByHighlightAndUser(
    highlightId: string,
    userId: string
  ): Promise<Vote | undefined> {
    return Array.from(this.votes.values()).find(
      (v) => v.highlightId === highlightId && v.userId === userId
    );
  }

  async countByHighlight(highlightId: string): Promise<VoteCounts> {
    const votes = await this.findByHighlight(highlightId);
    return {
      agrees: votes.filter((v) => v.voteType === "agree").length,
      disagrees: votes.filter((v) => v.voteType === "disagree").length,
    };
  }

  async count(): Promise<number> {
    return this.votes.size;
  }
}
