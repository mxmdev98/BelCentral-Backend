// src/routes/users.ts — admin user management
import { Router } from "express";
import { requireAuth, requireAdmin } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { z } from "zod";
import * as usersSvc from "../services/users.js";

const router = Router();

const createUserSchema = z.object({
  username: z.string().trim().min(3, "Min 3 characters").max(64),
  password: z.string().min(6, "Min 6 characters").max(128),
  role: z.enum(["official", "admin"]).default("official"),
});

const resetPasswordSchema = z.object({
  password: z.string().min(6, "Min 6 characters").max(128),
});

const toggleActiveSchema = z.object({
  is_active: z.boolean(),
});

// GET /api/users — list all users (admin only)
router.get("/", requireAuth, requireAdmin, async (_req, res, next) => {
  try {
    res.json({ items: await usersSvc.listUsers() });
  } catch (err) { next(err); }
});

// POST /api/users — create a new user (admin only)
router.post("/", requireAuth, requireAdmin, validate(createUserSchema), async (req, res, next) => {
  try {
    const user = await usersSvc.createUser(req.body.username, req.body.password, req.body.role);
    res.status(201).json(user);
  } catch (err) { next(err); }
});

// PUT /api/users/:id/password — reset password (admin only)
router.put("/:id/password", requireAuth, requireAdmin, validate(resetPasswordSchema), async (req, res, next) => {
  try {
    await usersSvc.resetPassword(Number(req.params.id), req.body.password);
    res.json({ ok: true });
  } catch (err) { next(err); }
});

// PUT /api/users/:id/active — enable/disable (admin only)
router.put("/:id/active", requireAuth, requireAdmin, validate(toggleActiveSchema), async (req, res, next) => {
  try {
    res.json(await usersSvc.toggleUserActive(Number(req.params.id), req.body.is_active));
  } catch (err) { next(err); }
});

// DELETE /api/users/:id — delete user (admin only, cannot delete last admin)
router.delete("/:id", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    await usersSvc.deleteUser(Number(req.params.id));
    res.status(204).end();
  } catch (err) { next(err); }
});

export default router;
