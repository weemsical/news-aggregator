import rateLimit, { ipKeyGenerator } from "express-rate-limit";
import { Request, Response, NextFunction } from "express";

function getIpKey(req: Request): string {
  return ipKeyGenerator(req.ip || "unknown");
}

const perArticleLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20,
  keyGenerator: (req: Request) => {
    const ip = getIpKey(req);
    const articleId = req.params.id || "unknown";
    return `${ip}:${articleId}`;
  },
  standardHeaders: false,
  legacyHeaders: false,
  message: { error: "Too many highlights for this article. Please try again later." },
});

const perDayLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 24 hours
  max: 100,
  keyGenerator: (req: Request) => getIpKey(req),
  standardHeaders: false,
  legacyHeaders: false,
  message: { error: "Daily highlight limit reached. Please try again tomorrow." },
});

export function anonRateLimit(req: Request, res: Response, next: NextFunction): void {
  if (req.user) {
    next();
    return;
  }
  perArticleLimiter(req, res, (err?: any) => {
    if (err) return next(err);
    if (res.headersSent) return;
    perDayLimiter(req, res, next);
  });
}
