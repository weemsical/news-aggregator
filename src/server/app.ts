import express from "express";
import cookieParser from "cookie-parser";
import { ArticleRepository, HighlightRepository, UserRepository, FeedSourceRepository, RawArticleRepository, VoteRepository, CommentRepository, HighlightClusterRepository, ReplacementRuleRepository, NotificationRepository } from "@repositories";
import { articlesRouter, highlightsRouter, highlightActionsRouter, authRouter, scoresRouter, adminRouter, votesRouter, commentsRouter, replacementRulesRouter, notificationsRouter } from "@routes";
import { ClusterService, ScoringService, NotificationService } from "@services";
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
  replacementRules: ReplacementRuleRepository;
  notifications: NotificationRepository;
  rateLimitMiddleware?: RequestHandler;
}

export function createApp({ articles, highlights, users, feedSources, rawArticles, votes, comments, highlightClusters, replacementRules, notifications, rateLimitMiddleware }: AppDeps) {
  const app = express();

  const clusterService = new ClusterService(highlights, highlightClusters);
  const scoringService = new ScoringService(highlightClusters, votes, articles);
  const notificationService = new NotificationService(notifications, highlights, users, comments);

  app.use(express.json());
  app.use(cookieParser());
  app.use("/api/auth", authRouter(users));
  app.use("/api/articles", articlesRouter(articles, { feedSources, rawArticles, replacementRules }));
  app.use("/api/articles/:id/highlights", highlightsRouter(articles, highlights, rateLimitMiddleware, highlightClusters, votes, scoringService));
  app.use("/api/highlights", highlightActionsRouter(highlights, clusterService, scoringService));
  app.use("/api/highlights", votesRouter(highlights, votes, scoringService, notificationService));
  app.use("/api/highlights", commentsRouter(highlights, votes, comments, notificationService));
  app.use("/api/scores", scoresRouter(articles, feedSources));
  app.use("/api/admin", adminRouter(feedSources, articles, users, rawArticles, replacementRules));
  app.use("/api/admin", replacementRulesRouter(replacementRules, rawArticles, users));
  app.use("/api/notifications", notificationsRouter(notifications, users));

  return app;
}
