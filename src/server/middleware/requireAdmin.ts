import { Request, Response, NextFunction } from "express";
import { UserRepository } from "@repositories";

export function createRequireAdmin(users: UserRepository) {
  return async function requireAdmin(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    if (!req.user) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }

    const user = await users.findById(req.user.userId);
    if (!user) {
      res.status(401).json({ error: "User not found" });
      return;
    }

    if (!user.isAdmin) {
      res.status(403).json({ error: "Admin access required" });
      return;
    }

    next();
  };
}
