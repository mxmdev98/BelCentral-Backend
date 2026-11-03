// src/routes/auth.ts
import { Router } from "express";
import { validate } from "../middleware/validate.js";
import { loginSchema } from "../schemas/auth.js";
import { login, me } from "../services/auth.js";
import { requireAuth } from "../middleware/auth.js";
import { setAuthCookie, clearAuthCookie } from "../utils/jwt.js";

const router = Router();

router.post("/login", validate(loginSchema), async (req, res, next) => {
  try {
    const { token, user } = await login(req.body);
    setAuthCookie(res, token);
    res.json({ user });
  } catch (err) {
    next(err);
  }
});

router.post("/logout", (_req, res) => {
  clearAuthCookie(res);
  res.json({ ok: true });
});

router.get("/me", requireAuth, async (req, res, next) => {
  try {
    const user = await me(req.user!.id);
    res.json({ user });
  } catch (err) {
    next(err);
  }
});

export default router;
