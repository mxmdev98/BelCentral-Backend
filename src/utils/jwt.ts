// src/utils/jwt.ts — sign/verify JWT and read/write the auth cookie.
import jwt, { type JwtPayload } from "jsonwebtoken";
import type { Request, Response } from "express";

export interface AuthUser {
  id: number;
  username: string;
  role: "official" | "admin";
}

const SECRET = process.env.JWT_SECRET;
const EXPIRES_IN = process.env.JWT_EXPIRES_IN ?? "12h";
const COOKIE_NAME = process.env.COOKIE_NAME ?? "rb_token";
const SECURE = process.env.SECURE_COOKIES === "true";

if (!SECRET) {
  throw new Error("JWT_SECRET is not set. Copy .env.example to .env.");
}

export function signToken(user: AuthUser): string {
  return jwt.sign(user, SECRET, { expiresIn: EXPIRES_IN } as jwt.SignOptions);
}

export function verifyToken(token: string): AuthUser {
  const payload = jwt.verify(token, SECRET) as JwtPayload;
  return {
    id: Number(payload.id),
    username: String(payload.username),
    role: payload.role as "official" | "admin",
  };
}

export function setAuthCookie(res: Response, token: string): void {
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    // When SECURE=true (production, HTTPS), use sameSite=none so the cookie
    // works across subdomains (recordbook.example.pg <-> api.recordbook.example.pg).
    // In dev (SECURE=false), use lax so localhost works without HTTPS.
    sameSite: SECURE ? "none" : "lax",
    secure: SECURE,
    maxAge: 12 * 60 * 60 * 1000, // 12h — keep in sync with JWT_EXPIRES_IN
    path: "/",
  });
}

export function clearAuthCookie(res: Response): void {
  res.clearCookie(COOKIE_NAME, { path: "/" });
}

export function readAuthCookie(req: Request): string | undefined {
  return req.cookies?.[COOKIE_NAME];
}

export const AUTH_COOKIE_NAME = COOKIE_NAME;
