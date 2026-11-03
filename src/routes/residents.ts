// src/routes/residents.ts
import { Router } from "express";
import { requireAuth, requireAdmin } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import {
  createResidentSchema,
  updateResidentSchema,
  searchResidentsSchema,
  type SearchResidentsInput,
} from "../schemas/residents.js";
import * as svc from "../services/residents.js";

const router = Router();

// GET /api/residents?q=...&page=1&limit=25&...
router.get("/", requireAuth, validate(searchResidentsSchema, "query"), async (req, res, next) => {
  try {
    const result = await svc.searchResidents(req.query as unknown as SearchResidentsInput);
    res.json(result);
  } catch (err) { next(err); }
});

router.get("/:id", requireAuth, async (req, res, next) => {
  try {
    res.json(await svc.getResident(req.params.id));
  } catch (err) { next(err); }
});

router.post("/", requireAuth, validate(createResidentSchema), async (req, res, next) => {
  try {
    const resident = await svc.createResident(req.body, req.user!.id);
    res.status(201).json(resident);
  } catch (err) { next(err); }
});

router.put("/:id", requireAuth, validate(updateResidentSchema), async (req, res, next) => {
  try {
    res.json(await svc.updateResident(req.params.id, req.body));
  } catch (err) { next(err); }
});

// Soft delete — admin only.
router.delete("/:id", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    await svc.softDeleteResident(req.params.id);
    res.status(204).end();
  } catch (err) { next(err); }
});

export default router;
