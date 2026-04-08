import { Router } from "express";
import { FeedSourceRepository, ArticleRepository, UserRepository } from "@repositories";
import { requireAuth, createRequireAdmin } from "@middleware";
import { getAllFeedSources } from "@data";
import { fetchFeed, parseRssFeed } from "@services";

export function adminRouter(
  feedSourceRepo: FeedSourceRepository,
  articleRepo: ArticleRepository,
  users: UserRepository
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

      const articles = parseRssFeed(result.xml, source);
      let savedCount = 0;
      for (const article of articles) {
        const exists = await articleRepo.exists(article.id);
        if (!exists) {
          await articleRepo.save(article);
          savedCount++;
        }
      }

      res.json({
        articlesFound: articles.length,
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
    const user = await users.findById(req.params.userId);
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    const updated = await users.setAdmin(user.id, false);
    res.json({ id: updated!.id, email: updated!.email, isAdmin: updated!.isAdmin });
  });

  return router;
}
