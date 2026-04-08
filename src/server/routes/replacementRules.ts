import { Router } from "express";
import { ReplacementRuleRepository, RawArticleRepository } from "@repositories";
import { UserRepository } from "@repositories";
import { requireAuth, createRequireAdmin } from "@middleware";
import { ReplacementService } from "@services";
import crypto from "crypto";

export function replacementRulesRouter(
  replacementRules: ReplacementRuleRepository,
  rawArticles: RawArticleRepository,
  users: UserRepository
): Router {
  const router = Router();
  const requireAdmin = createRequireAdmin(users);

  router.use(requireAuth, requireAdmin);

  router.get("/sources/:sourceId/rules", async (req, res) => {
    try {
      const rules = await replacementRules.findBySource(req.params.sourceId);
      res.json(rules);
    } catch {
      res.status(500).json({ error: "Failed to load rules" });
    }
  });

  router.post("/sources/:sourceId/rules", async (req, res) => {
    const { pattern, replacementText, isRegex } = req.body;

    if (!pattern || !String(pattern).trim()) {
      res.status(400).json({ error: "pattern is required" });
      return;
    }
    if (!replacementText && replacementText !== "") {
      res.status(400).json({ error: "replacementText is required" });
      return;
    }

    const now = Date.now();
    const rule = {
      id: crypto.randomUUID(),
      sourceId: req.params.sourceId,
      pattern: String(pattern).trim(),
      replacementText: String(replacementText),
      isRegex: Boolean(isRegex),
      createdAt: now,
      updatedAt: now,
    };

    try {
      await replacementRules.save(rule);
      res.status(201).json(rule);
    } catch {
      res.status(500).json({ error: "Failed to create rule" });
    }
  });

  router.put("/rules/:id", async (req, res) => {
    try {
      const existing = await replacementRules.findById(req.params.id);
      if (!existing) {
        res.status(404).json({ error: "Rule not found" });
        return;
      }

      const updated = {
        ...existing,
        pattern: req.body.pattern != null ? String(req.body.pattern).trim() : existing.pattern,
        replacementText: req.body.replacementText != null ? String(req.body.replacementText) : existing.replacementText,
        isRegex: req.body.isRegex != null ? Boolean(req.body.isRegex) : existing.isRegex,
        updatedAt: Date.now(),
      };

      await replacementRules.update(updated);
      res.json(updated);
    } catch {
      res.status(500).json({ error: "Failed to update rule" });
    }
  });

  router.delete("/rules/:id", async (req, res) => {
    try {
      const removed = await replacementRules.delete(req.params.id);
      if (!removed) {
        res.status(404).json({ error: "Rule not found" });
        return;
      }
      res.json({ ok: true });
    } catch {
      res.status(500).json({ error: "Failed to delete rule" });
    }
  });

  router.post("/sources/:sourceId/rules/preview", async (req, res) => {
    const { pattern, replacementText, isRegex } = req.body;

    if (!pattern || !String(pattern).trim()) {
      res.status(400).json({ error: "pattern is required" });
      return;
    }

    try {
      const articles = await rawArticles.findBySource(req.params.sourceId, 5);
      const rule = {
        id: "preview",
        sourceId: req.params.sourceId,
        pattern: String(pattern).trim(),
        replacementText: String(replacementText ?? ""),
        isRegex: Boolean(isRegex),
        createdAt: 0,
        updatedAt: 0,
      };

      const matches: Array<{ articleId: string; original: string; replaced: string }> = [];
      for (const article of articles) {
        const result = ReplacementService.applyRules(article.body, [rule]);
        if (result.replacementMap.length > 0) {
          for (const entry of result.replacementMap) {
            matches.push({
              articleId: article.id,
              original: article.body[entry.paragraphIndex],
              replaced: result.processed[entry.paragraphIndex],
            });
          }
        }
      }

      res.json({ matches });
    } catch {
      res.status(500).json({ error: "Failed to preview rule" });
    }
  });

  return router;
}
