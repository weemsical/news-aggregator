import { Router } from "express";
import { FeedSourceRepository, ArticleRepository, UserRepository, RawArticleRepository, ReplacementRuleRepository } from "@repositories";
import { requireAuth, createRequireAdmin } from "@middleware";
import { getAllFeedSources } from "@data";
import { fetchFeed, parseRssFeed, ReplacementService, ScheduledIngestion } from "@services";

export function adminRouter(
  feedSourceRepo: FeedSourceRepository,
  articleRepo: ArticleRepository,
  users: UserRepository,
  rawArticleRepo?: RawArticleRepository,
  replacementRuleRepo?: ReplacementRuleRepository
): Router {
  const router = Router();
  const requireAdmin = createRequireAdmin(users);

  router.use(requireAuth, requireAdmin);

  router.get("/feed-sources", async (_req, res) => {
    try {
      const all = await getAllFeedSources(feedSourceRepo);
      const dbSources = await feedSourceRepo.findAll();
      const dbSourceIds = new Set(dbSources.map((s) => s.sourceId));

      const enriched = all.map((s) => ({
        ...s,
        isDynamic: dbSourceIds.has(s.sourceId),
      }));
      res.json(enriched);
    } catch {
      res.status(500).json({ error: "Failed to load feed sources" });
    }
  });

  router.post("/feed-sources", async (req, res) => {
    const { sourceId, name, feedUrl, defaultTags } = req.body;

    if (!sourceId || !String(sourceId).trim()) {
      res.status(400).json({ error: "sourceId is required" });
      return;
    }
    if (!name || !String(name).trim()) {
      res.status(400).json({ error: "name is required" });
      return;
    }
    if (!feedUrl || !String(feedUrl).trim()) {
      res.status(400).json({ error: "feedUrl is required" });
      return;
    }

    const source = {
      sourceId: String(sourceId).trim(),
      name: String(name).trim(),
      feedUrl: String(feedUrl).trim(),
      defaultTags: Array.isArray(defaultTags) ? defaultTags.map(String) : [],
      publishMode: (req.body.publishMode === "manual" ? "manual" : "auto") as "auto" | "manual",
    };

    try {
      await feedSourceRepo.save(source);
      res.status(201).json(source);
    } catch {
      res.status(500).json({ error: "Failed to save feed source" });
    }
  });

  router.delete("/feed-sources/:sourceId", async (req, res) => {
    try {
      const removed = await feedSourceRepo.remove(req.params.sourceId);
      if (!removed) {
        res.status(404).json({ error: "Feed source not found" });
        return;
      }
      res.json({ ok: true });
    } catch {
      res.status(500).json({ error: "Failed to delete feed source" });
    }
  });

  router.put("/feed-sources/:sourceId", async (req, res) => {
    try {
      const all = await getAllFeedSources(feedSourceRepo);
      const existing = all.find((s) => s.sourceId === req.params.sourceId);
      if (!existing) {
        res.status(404).json({ error: "Feed source not found" });
        return;
      }

      const updated = {
        ...existing,
        publishMode: (req.body.publishMode === "manual" ? "manual" : existing.publishMode ?? "auto") as "auto" | "manual",
      };
      await feedSourceRepo.save(updated);
      res.json(updated);
    } catch {
      res.status(500).json({ error: "Failed to update feed source" });
    }
  });

  router.post("/feed-sources/:sourceId/fetch", async (req, res) => {
    try {
      const all = await getAllFeedSources(feedSourceRepo);
      const source = all.find((s) => s.sourceId === req.params.sourceId);
      if (!source) {
        res.status(404).json({ error: "Feed source not found" });
        return;
      }

      const result = await fetchFeed(source.feedUrl);
      if (!result.ok || !result.xml) {
        res.status(502).json({ error: `Failed to fetch feed: ${result.error}` });
        return;
      }

      const parsedArticles = parseRssFeed(result.xml, source);
      let savedCount = 0;

      // Determine review status based on publish mode
      const reviewStatus = source.publishMode === "manual" ? "pending" : "approved";

      // Load replacement rules for this source
      const rules = replacementRuleRepo
        ? await replacementRuleRepo.findBySource(source.sourceId)
        : [];

      for (const article of parsedArticles) {
        const exists = await articleRepo.exists(article.id);
        if (!exists) {
          // Save raw article first
          if (rawArticleRepo) {
            await rawArticleRepo.save({
              id: article.rawArticleId,
              title: article.title,
              body: article.body,
              sourceId: article.sourceId,
              url: article.url,
              fetchedAt: article.fetchedAt,
            });
          }

          // Apply replacement rules
          let processedBody = article.body;
          if (rules.length > 0) {
            const replaced = ReplacementService.applyRules(article.body, rules);
            processedBody = replaced.processed;
          }

          // Save processed article with correct review status
          await articleRepo.save({
            ...article,
            body: processedBody,
            reviewStatus,
          });
          savedCount++;
        }
      }

      res.json({
        articlesFound: parsedArticles.length,
        newArticlesSaved: savedCount,
      });
    } catch {
      res.status(500).json({ error: "Failed to fetch articles" });
    }
  });

  router.get("/admins", async (_req, res) => {
    const admins = await users.findAdmins();
    res.json(admins.map((u) => ({ id: u.id, email: u.email, isAdmin: u.isAdmin })));
  });

  router.post("/admins", async (req, res) => {
    const { userId, email } = req.body;

    let user;
    if (email && String(email).trim()) {
      user = await users.findByEmail(String(email).trim());
    } else if (userId && String(userId).trim()) {
      user = await users.findById(String(userId));
    } else {
      res.status(400).json({ error: "email or userId is required" });
      return;
    }

    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    const updated = await users.setAdmin(user.id, true);
    res.json({ id: updated!.id, email: updated!.email, isAdmin: updated!.isAdmin });
  });

  router.delete("/admins/:userId", async (req, res) => {
    if (req.params.userId === req.user!.userId) {
      res.status(400).json({ error: "Cannot remove yourself as admin" });
      return;
    }

    const user = await users.findById(req.params.userId);
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    const updated = await users.setAdmin(user.id, false);
    res.json({ id: updated!.id, email: updated!.email, isAdmin: updated!.isAdmin });
  });

  router.post("/refresh-all", async (_req, res) => {
    if (!rawArticleRepo || !replacementRuleRepo) {
      res.status(500).json({ error: "Refresh not available" });
      return;
    }

    try {
      const result = await ScheduledIngestion.runIngestion({
        articles: articleRepo,
        rawArticles: rawArticleRepo,
        feedSources: feedSourceRepo,
        replacementRules: replacementRuleRepo,
      });

      res.json({
        articlesFound: result.feedResults.reduce(
          (sum, r) => sum + r.articlesSaved,
          0
        ),
        newArticlesSaved: result.totalArticlesSaved,
      });
    } catch {
      res.status(500).json({ error: "Failed to refresh articles" });
    }
  });

  // Review queue routes
  router.get("/review-queue", async (_req, res) => {
    try {
      const pending = await articleRepo.findByReviewStatus("pending");
      res.json(pending);
    } catch {
      res.status(500).json({ error: "Failed to load review queue" });
    }
  });

  router.post("/articles/:id/approve", async (req, res) => {
    try {
      const updated = await articleRepo.updateReviewStatus(req.params.id, "approved");
      if (!updated) {
        res.status(404).json({ error: "Article not found" });
        return;
      }
      res.json(updated);
    } catch {
      res.status(500).json({ error: "Failed to approve article" });
    }
  });

  router.post("/articles/:id/reject", async (req, res) => {
    try {
      const updated = await articleRepo.updateReviewStatus(req.params.id, "rejected");
      if (!updated) {
        res.status(404).json({ error: "Article not found" });
        return;
      }
      res.json(updated);
    } catch {
      res.status(500).json({ error: "Failed to reject article" });
    }
  });

  router.post("/articles/:id/reprocess", async (req, res) => {
    try {
      const article = await articleRepo.findById(req.params.id);
      if (!article) {
        res.status(404).json({ error: "Article not found" });
        return;
      }

      if (!rawArticleRepo || !replacementRuleRepo) {
        res.status(500).json({ error: "Reprocessing not available" });
        return;
      }

      const rawArticle = await rawArticleRepo.findById(article.rawArticleId);
      if (!rawArticle) {
        res.status(404).json({ error: "Raw article not found" });
        return;
      }

      const rules = await replacementRuleRepo.findBySource(article.sourceId);
      const result = ReplacementService.applyRules(rawArticle.body, rules);

      res.json({
        body: result.processed,
        replacementMap: result.replacementMap,
      });
    } catch {
      res.status(500).json({ error: "Failed to reprocess article" });
    }
  });

  return router;
}
