// src/middleware/error.ts — central error handler.
// Always emits the standard shape: { error: string, details?: Record<string,string> }
import type { ErrorRequestHandler } from "express";
import { ZodError } from "zod";
import { HttpError } from "../utils/errors.js";
import { logger } from "../utils/logger.js";

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  // Zod → 400 with field-level details.
  if (err instanceof ZodError) {
    const details: Record<string, string> = {};
    for (const issue of err.issues) {
      const key = issue.path.join(".") || "_";
      details[key] = issue.message;
    }
    return res.status(400).json({ error: "Validation failed", details });
  }

  // Our typed errors.
  if (err instanceof HttpError) {
    return res.status(err.status).json({ error: err.message, details: err.details });
  }

  // Postgres unique-violation (23505) → friendly 409 for residents.
  if (err && typeof err === "object" && "code" in err && err.code === "23505") {
    const constraint = (err as { constraint?: string }).constraint;
    if (constraint === "residents_name_dob_clan_unique") {
      return res.status(409).json({
        error: "A resident with this name and date of birth already exists in this clan.",
      });
    }
    // Generic unique violation.
    return res.status(409).json({ error: "A record with these values already exists." });
  }

  // Postgres foreign-key violation (23503) → 400 friendly.
  if (err && typeof err === "object" && "code" in err && err.code === "23503") {
    return res.status(400).json({
      error: "Referenced record does not exist (invalid village/tribe/clan).",
    });
  }

  // Fallback
  logger.error({ err }, "Unhandled error");
  return res.status(500).json({ error: "Internal server error" });
};
