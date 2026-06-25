import { VoteRepository } from "@repositories";
import { Vote } from "@types";
import { ScoringService } from "./ScoringService";
import { NotificationService } from "./NotificationService";
import crypto from "crypto";

export interface CastVoteParams {
  highlightId: string;
  userId: string;
  voteType: "agree" | "disagree";
  reason?: string;
  articleId: string;
}

export interface CastVoteResult {
  vote: Vote;
  isNew: boolean;
}

export class VoteService {
  constructor(
    private voteRepo: VoteRepository,
    private scoringService: ScoringService,
    private notificationService: NotificationService
  ) {}

  async castVote(params: CastVoteParams): Promise<CastVoteResult> {
    const { highlightId, userId, voteType, reason, articleId } = params;

    const existing = await this.voteRepo.findByHighlightAndUser(highlightId, userId);

    let vote: Vote;
    let isNew: boolean;

    if (existing) {
      const updated = await this.voteRepo.update(existing.id, {
        voteType,
        reason: voteType === "disagree" ? (reason ? String(reason) : null) : null,
      });
      vote = updated!;
      isNew = false;
    } else {
      const now = Date.now();
      vote = {
        id: crypto.randomUUID(),
        highlightId,
        userId,
        voteType,
        reason: voteType === "disagree" ? (reason ? String(reason) : null) : null,
        createdAt: now,
        updatedAt: now,
      };
      await this.voteRepo.save(vote);
      isNew = true;
    }

    await this.scoringService.recalculateScore(articleId);

    if (voteType === "agree") {
      await this.notificationService.notifyAgreement(highlightId, userId);
    } else {
      await this.notificationService.notifyDisagreement(highlightId, userId);
    }

    return { vote, isNew };
  }
}
