import { ArticleRepository } from "./ArticleRepository";
import { HighlightRepository } from "./HighlightRepository";
import { UserRepository } from "./UserRepository";
import { FeedSourceRepository } from "./FeedSourceRepository";
import { RawArticleRepository } from "./RawArticleRepository";
import { VoteRepository } from "./VoteRepository";
import { CommentRepository } from "./CommentRepository";
import { HighlightClusterRepository } from "./HighlightClusterRepository";
import { PostgresArticleRepository } from "./PostgresArticleRepository";
import { PostgresHighlightRepository } from "./PostgresHighlightRepository";
import { PostgresUserRepository } from "./PostgresUserRepository";
import { PostgresFeedSourceRepository } from "./PostgresFeedSourceRepository";
import { PostgresRawArticleRepository } from "./PostgresRawArticleRepository";
import { PostgresVoteRepository } from "./PostgresVoteRepository";
import { PostgresCommentRepository } from "./PostgresCommentRepository";
import { PostgresHighlightClusterRepository } from "./PostgresHighlightClusterRepository";
import { getPool } from "../db/pool";

export interface Repositories {
  articles: ArticleRepository;
  highlights: HighlightRepository;
  users: UserRepository;
  feedSources: FeedSourceRepository;
  rawArticles: RawArticleRepository;
  votes: VoteRepository;
  comments: CommentRepository;
  highlightClusters: HighlightClusterRepository;
}

export function createRepositories(): Repositories {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error("DATABASE_URL environment variable is required");
  }

  const pool = getPool();
  return {
    articles: new PostgresArticleRepository(pool),
    highlights: new PostgresHighlightRepository(pool),
    users: new PostgresUserRepository(pool),
    feedSources: new PostgresFeedSourceRepository(pool),
    rawArticles: new PostgresRawArticleRepository(pool),
    votes: new PostgresVoteRepository(pool),
    comments: new PostgresCommentRepository(pool),
    highlightClusters: new PostgresHighlightClusterRepository(pool),
  };
}
