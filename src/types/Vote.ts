export interface Vote {
  id: string;
  highlightId: string;
  userId: string;
  voteType: "agree" | "disagree";
  reason: string | null;
  createdAt: number;
  updatedAt: number;
}
