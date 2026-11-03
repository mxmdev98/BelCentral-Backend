// src/schemas/tribes.ts
import { z } from "zod";

export const createTribeSchema = z.object({
  village_id: z.coerce.number().int().positive("village_id is required"),
  name: z.string().trim().min(1, "Tribe name is required").max(120),
});

export type CreateTribeInput = z.infer<typeof createTribeSchema>;
