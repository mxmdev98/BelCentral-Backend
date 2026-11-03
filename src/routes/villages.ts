// src/routes/villages.ts
import { Router } from "express";
import { requireAuth, requireAdmin } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { createVillageSchema } from "../schemas/villages.js";
import * as svc from "../services/villages.js";

const router = Router();

router.get("/", requireAuth, async (_req, res, next) => {
  try {
    const items = await svc.listVillages(true);
    res.json({ items });
  } catch (err) { next(err); }
});

router.get("/:id", requireAuth, async (req, res, next) => {
  try {
    res.json(await svc.getVillage(Number(req.params.id)));
  } catch (err) { next(err); }
});

router.post("/", requireAuth, requireAdmin, validate(createVillageSchema), async (req, res, next) => {
  try {
    res.status(201).json(await svc.createVillage(req.body));
  } catch (err) { next(err); }
});

router.put("/:id", requireAuth, requireAdmin, validate(createVillageSchema), async (req, res, next) => {
  try {
    res.json(await svc.updateVillage(Number(req.params.id), req.body));
  } catch (err) { next(err); }
});

router.delete("/:id", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    await svc.deleteVillage(Number(req.params.id));
    res.status(204).end();
  } catch (err) { next(err); }
});

export default router;
