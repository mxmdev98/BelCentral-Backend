// src/middleware/auth.ts — requireAuth (any logged-in user) + requireAdmin.
import type { Request, Response, NextFunction } from "express";
import { readAuthCookie, verifyToken, type AuthUser } from "../utils/jwt.js";
import { unauthorized } from "../utils/errors.js";

// Augment Express.Request with the `user` field set by requireAuth.
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  const token = readAuthCookie(req);
  if (!token) return next(unauthorized("Not authenticated"));

  try {
    req.user = verifyToken(token);
    next();
  } catch {
    return next(unauthorized("Invalid or expired session"));
  }
}

export function requireAdmin(req: Request, _res: Response, next: NextFunction): void {
  if (!req.user) return next(unauthorized("Not authenticated"));
  if (req.user.role !== "admin") return next(unauthorized("Admin access required"));
  next();
}
