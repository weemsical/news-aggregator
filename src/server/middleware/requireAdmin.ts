import { Request, Response, NextFunction } from "express";
import { UserRepository } from "../../repositories/UserRepository";

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

    const adminEmails = (process.env.ADMIN_EMAILS || "")
      .split(",")
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean);

    if (adminEmails.length === 0) {
      res.status(403).json({ error: "No admin users configured" });
      return;
    }

    const user = await users.findById(req.user.userId);
    if (!user) {
      res.status(401).json({ error: "User not found" });
      return;
    }

    if (!adminEmails.includes(user.email.toLowerCase())) {
      res.status(403).json({ error: "Admin access required" });
      return;
    }

    next();
  };
}
