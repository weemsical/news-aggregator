import { Request, Response, NextFunction } from "express";

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  const message = err instanceof Error ? err.message : String(err);
  console.error("[error]", message);

  if (!res.headersSent) {
    res.status(500).json({ error: "Internal server error" });
  }
}
