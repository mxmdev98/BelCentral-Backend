// src/routes/reports.ts
import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { reportTypeSchema } from "../schemas/reports.js";
import { getReport } from "../services/reports.js";
import { badRequest } from "../utils/errors.js";

const router = Router();

// GET /api/reports/:type
router.get("/:type", requireAuth, async (req, res, next) => {
  try {
    const parsed = reportTypeSchema.safeParse(req.params.type);
    if (!parsed.success) {
      throw badRequest("Unknown report type", { type: "Use one of: residents_per_village, gender_per_village, by_tribe_and_clan, by_employment, by_marital, by_education, age_distribution" });
    }
    const result = await getReport(parsed.data);
    res.json(result);
  } catch (err) { next(err); }
});

export default router;
