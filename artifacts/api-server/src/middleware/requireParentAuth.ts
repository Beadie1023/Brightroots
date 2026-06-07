import { type Request, type Response, type NextFunction } from "express";
import jwt from "jsonwebtoken";

export function requireParentAuth(req: Request, res: Response, next: NextFunction): void {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    res.status(503).json({ error: "SESSION_SECRET is not configured" });
    return;
  }
  const authHeader = req.headers["authorization"];
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  try {
    jwt.verify(token, secret);
    next();
  } catch {
    res.status(401).json({ error: "Invalid or expired token" });
  }
}
