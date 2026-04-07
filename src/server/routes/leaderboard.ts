import { Router } from "express";

export function leaderboardRouter(): Router {
  const router = Router();

  router.get("/", async (_req, res) => {
    // Stubbed — will be replaced by scores page in Phase 4
    res.json([]);
  });

  return router;
}
