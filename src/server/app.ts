import express from "express";
import cookieParser from "cookie-parser";
import { ArticleRepository, HighlightRepository, UserRepository, FeedSourceRepository, RawArticleRepository, VoteRepository, CommentRepository, HighlightClusterRepository } from "@repositories";
import { articlesRouter, highlightsRouter, highlightActionsRouter, authRouter, leaderboardRouter, scoresRouter, adminRouter, votesRouter, commentsRouter } from "@routes";
import { ClusterService, ScoringService } from "@services";
import { RequestHandler } from "express";

interface AppDeps {
  articles: ArticleRepository;
  highlights: HighlightRepository;
  users: UserRepository;
  feedSources: FeedSourceRepository;
  rawArticles: RawArticleRepository;
  votes: VoteRepository;
  comments: CommentRepository;
  highlightClusters: HighlightClusterRepository;
  rateLimitMiddleware?: RequestHandler;
}

export function createApp({ articles, highlights, users, feedSources, rawArticles, votes, comments, highlightClusters, rateLimitMiddleware }: AppDeps) {
  const app = express();

  const clusterService = new ClusterService(highlights, highlightClusters);
  const scoringService = new ScoringService(highlightClusters, votes, articles);

  app.use(express.json());
  app.use(cookieParser());
  app.use("/api/auth", authRouter(users));
  app.use("/api/articles", articlesRouter(articles));
  app.use("/api/articles/:id/highlights", highlightsRouter(articles, highlights, rateLimitMiddleware, highlightClusters, votes, scoringService));
  app.use("/api/highlights", highlightActionsRouter(highlights, clusterService, scoringService));
  app.use("/api/highlights", votesRouter(highlights, votes, scoringService));
  app.use("/api/highlights", commentsRouter(highlights, votes, comments));
  app.use("/api/leaderboard", leaderboardRouter());
  app.use("/api/scores", scoresRouter(articles, feedSources));
  app.use("/api/admin", adminRouter(feedSources, articles, users));

  return app;
}
