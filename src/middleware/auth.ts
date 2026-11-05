// src/middleware/auth.ts — requireAuth + requireAdmin + requirePermission
import type { Request, Response, NextFunction } from "express";
import { readAuthCookie, verifyToken, type AuthUser } from "../utils/jwt.js";
import { unauthorized, forbidden } from "../utils/errors.js";
import { hasPermission } from "../services/permissions.js";

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
  if (req.user.role !== "admin") return next(forbidden("Admin access required"));
  next();
}

// requirePermission(resource, action)
//   - Admin role always passes.
//   - Officials must have the specific permission row set to true.
//   - Action 'delete' is always admin-only (no permission row for it).
export function requirePermission(resource: string, action: "read" | "create" | "update") {
  return async (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) return next(unauthorized("Not authenticated"));
    if (req.user.role === "admin") return next(); // admin bypasses
    try {
      const allowed = await hasPermission(req.user.id, req.user.role, resource, action);
      if (!allowed) {
        return next(forbidden(`You do not have ${action} permission on ${resource}`));
      }
      next();
    } catch (err) {
      next(err);
    }
  };
}