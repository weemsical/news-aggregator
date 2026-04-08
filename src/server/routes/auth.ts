import { Router } from "express";
import crypto from "crypto";
import { UserRepository } from "@repositories";
import {
  hashPassword,
  verifyPassword,
  signToken,
  isValidEmail,
  isValidPassword,
} from "../auth";
import { requireAuth } from "@middleware";

export function authRouter(users: UserRepository): Router {
  const router = Router();

  router.post("/signup", async (req, res) => {
    const { email, password } = req.body;

    if (!email || !isValidEmail(email)) {
      res.status(400).json({ error: "Valid email is required" });
      return;
    }
    if (!password || !isValidPassword(password)) {
      res
        .status(400)
        .json({ error: "Password must be at least 8 characters" });
      return;
    }

    const existing = await users.findByEmail(email);
    if (existing) {
      res.status(409).json({ error: "Email already registered" });
      return;
    }

    const adminEmails = (process.env.ADMIN_EMAILS || "")
      .split(",")
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean);

    const passwordHash = await hashPassword(password);
    const user = {
      id: crypto.randomUUID(),
      email,
      passwordHash,
      isAdmin: adminEmails.includes(email.toLowerCase()),
      createdAt: Date.now(),
    };
    await users.save(user);

    const token = signToken(user.id);
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax" as const,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    res.status(201).json({ id: user.id, email: user.email });
  });

  router.post("/login", async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: "Email and password are required" });
      return;
    }

    const user = await users.findByEmail(email);
    if (!user) {
      res.status(401).json({ error: "Invalid email or password" });
      return;
    }

    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) {
      res.status(401).json({ error: "Invalid email or password" });
      return;
    }

    const token = signToken(user.id);
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax" as const,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    res.json({ id: user.id, email: user.email });
  });

  router.post("/logout", (_req, res) => {
    res.clearCookie("token");
    res.json({ ok: true });
  });

  router.get("/me", requireAuth, async (req, res) => {
    const user = await users.findById(req.user!.userId);
    if (!user) {
      res.status(401).json({ error: "User not found" });
      return;
    }
    res.json({ id: user.id, email: user.email, isAdmin: user.isAdmin });
  });

  return router;
}
