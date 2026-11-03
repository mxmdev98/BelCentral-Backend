// src/routes/tribes.ts
import { Router } from "express";
import { requireAuth, requireAdmin } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { createTribeSchema } from "../schemas/tribes.js";
import * as svc from "../services/tribes.js";

const router = Router();

// GET /api/tribes?village_id=1
router.get("/", requireAuth, async (req, res, next) => {
  try {
    const villageId = req.query.village_id ? Number(req.query.village_id) : undefined;
    const items = await svc.listTribes(villageId);
    res.json({ items });
  } catch (err) { next(err); }
});

router.get("/:id", requireAuth, async (req, res, next) => {
  try {
    res.json(await svc.getTribe(Number(req.params.id)));
  } catch (err) { next(err); }
});

router.post("/", requireAuth, requireAdmin, validate(createTribeSchema), async (req, res, next) => {
  try {
    res.status(201).json(await svc.createTribe(req.body));
  } catch (err) { next(err); }
});

router.put("/:id", requireAuth, requireAdmin, validate(createTribeSchema), async (req, res, next) => {
  try {
    res.json(await svc.updateTribe(Number(req.params.id), req.body));
  } catch (err) { next(err); }
});

router.delete("/:id", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    await svc.deleteTribe(Number(req.params.id));
    res.status(204).end();
  } catch (err) { next(err); }
});

export default router;
