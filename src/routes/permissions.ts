// src/routes/permissions.ts — admin manages per-user permissions
import { Router } from "express";
import { requireAuth, requireAdmin } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { z } from "zod";
import * as permsSvc from "../services/permissions.js";

const router = Router();

const upsertPermissionSchema = z.object({
  resource: z.string().min(1),
  can_read: z.boolean(),
  can_create: z.boolean(),
  can_update: z.boolean(),
});

// GET /api/permissions/me — get MY permissions (any authenticated user)
// Officials use this on login to know what they can do. Admins get full perms.
router.get("/me", requireAuth, async (req, res, next) => {
  try {
    if (req.user!.role === "admin") {
      // Admins bypass all checks
      res.json({
        id: req.user!.id,
        username: req.user!.username,
        role: "admin",
        is_active: true,
        created_at: "",
        permissions: [
          { resource: "residents", can_read: true, can_create: true, can_update: true },
          { resource: "ward_officials", can_read: true, can_create: true, can_update: true },
        ],
      });
      return;
    }
    const wp = await permsSvc.getUserWithPermissions(req.user!.id);
    res.json(wp);
  } catch (err) { next(err); }
});

// GET /api/permissions — list all users with their permissions (admin only)
router.get("/", requireAuth, requireAdmin, async (_req, res, next) => {
  try {
    res.json({ items: await permsSvc.listAllUsersWithPermissions() });
  } catch (err) { next(err); }
});

// GET /api/permissions/:userId — get one user's permissions (admin only)
router.get("/:userId", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    res.json(await permsSvc.getUserWithPermissions(Number(req.params.userId)));
  } catch (err) { next(err); }
});

// PUT /api/permissions/:userId — upsert a permission row for a user (admin only)
router.put("/:userId", requireAuth, requireAdmin, validate(upsertPermissionSchema), async (req, res, next) => {
  try {
    const perm = await permsSvc.upsertPermission(Number(req.params.userId), {
      resource: req.body.resource,
      can_read: req.body.can_read,
      can_create: req.body.can_create,
      can_update: req.body.can_update,
    });
    res.json(perm);
  } catch (err) { next(err); }
});

// DELETE /api/permissions/:userId/:resource — remove a permission row (admin only)
router.delete("/:userId/:resource", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    await permsSvc.deletePermission(Number(req.params.userId), req.params.resource);
    res.status(204).end();
  } catch (err) { next(err); }
});

export default router;
