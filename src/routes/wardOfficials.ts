// src/routes/wardOfficials.ts
import { Router } from "express";
import { requireAuth, requireAdmin, requirePermission } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { createWardOfficialSchema } from "../schemas/wardOfficials.js";
import * as svc from "../services/wardOfficials.js";

const router = Router();

router.get("/", requireAuth, requirePermission("ward_officials", "read"), async (req, res, next) => {
  try {
    const activeOnly = req.query.active === "true";
    const items = await svc.listWardOfficials(activeOnly);
    res.json({ items });
  } catch (err) { next(err); }
});

router.get("/:id", requireAuth, requirePermission("ward_officials", "read"), async (req, res, next) => {
  try {
    res.json(await svc.getWardOfficial(Number(req.params.id)));
  } catch (err) { next(err); }
});

router.post("/", requireAuth, requirePermission("ward_officials", "create"), validate(createWardOfficialSchema), async (req, res, next) => {
  try {
    res.status(201).json(await svc.createWardOfficial(req.body));
  } catch (err) { next(err); }
});

router.put("/:id", requireAuth, requirePermission("ward_officials", "update"), validate(createWardOfficialSchema), async (req, res, next) => {
  try {
    res.json(await svc.updateWardOfficial(Number(req.params.id), req.body));
  } catch (err) { next(err); }
});

// Delete — admin only (always).
router.delete("/:id", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    await svc.deleteWardOfficial(Number(req.params.id));
    res.status(204).end();
  } catch (err) { next(err); }
});

export default router;
