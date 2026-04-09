import { Router, Request } from "express";
import { NotificationRepository, UserRepository } from "@repositories";
import { requireAuth, createRequireAdmin } from "@middleware";

export function notificationsRouter(
  notificationRepo: NotificationRepository,
  users: UserRepository
): Router {
  const router = Router();
  const requireAdmin = createRequireAdmin(users);

  router.get("/", requireAuth, async (req, res) => {
    try {
      const notifications = await notificationRepo.findByUser(req.user!.userId);
      res.json(notifications);
    } catch {
      res.status(500).json({ error: "Failed to load notifications" });
    }
  });

  router.get("/unread-count", requireAuth, async (req, res) => {
    try {
      const count = await notificationRepo.countUnread(req.user!.userId);
      res.json({ count });
    } catch {
      res.status(500).json({ error: "Failed to count notifications" });
    }
  });

  router.post("/:id/read", requireAuth, async (req: Request<{ id: string }>, res) => {
    try {
      const success = await notificationRepo.markAsRead(req.params.id, req.user!.userId);
      if (!success) {
        res.status(404).json({ error: "Notification not found" });
        return;
      }
      res.json({ ok: true });
    } catch {
      res.status(500).json({ error: "Failed to mark as read" });
    }
  });

  router.post("/:id/acknowledge", requireAuth, requireAdmin, async (req: Request<{ id: string }>, res) => {
    try {
      const updated = await notificationRepo.acknowledge(req.params.id, req.user!.userId);
      if (!updated) {
        res.status(404).json({ error: "Notification not found" });
        return;
      }
      res.json(updated);
    } catch {
      res.status(500).json({ error: "Failed to acknowledge" });
    }
  });

  return router;
}
