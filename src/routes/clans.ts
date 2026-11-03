// src/routes/clans.ts
import { Router } from "express";
import { requireAuth, requireAdmin } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { createClanSchema } from "../schemas/clans.js";
import * as svc from "../services/clans.js";

const router = Router();

// GET /api/clans?tribe_id=1
router.get("/", requireAuth, async (req, res, next) => {
  try {
    const tribeId = req.query.tribe_id ? Number(req.query.tribe_id) : undefined;
    const items = await svc.listClans(tribeId);
    res.json({ items });
  } catch (err) { next(err); }
});

router.get("/:id", requireAuth, async (req, res, next) => {
  try {
    res.json(await svc.getClan(Number(req.params.id)));
  } catch (err) { next(err); }
});

router.post("/", requireAuth, requireAdmin, validate(createClanSchema), async (req, res, next) => {
  try {
    res.status(201).json(await svc.createClan(req.body));
  } catch (err) { next(err); }
});

router.put("/:id", requireAuth, requireAdmin, validate(createClanSchema), async (req, res, next) => {
  try {
    res.json(await svc.updateClan(Number(req.params.id), req.body));
  } catch (err) { next(err); }
});

router.delete("/:id", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    await svc.deleteClan(Number(req.params.id));
    res.status(204).end();
  } catch (err) { next(err); }
});

export default router;
