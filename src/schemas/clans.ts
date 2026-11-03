// src/schemas/clans.ts
import { z } from "zod";

export const createClanSchema = z.object({
  tribe_id: z.coerce.number().int().positive("tribe_id is required"),
  name: z.string().trim().min(1, "Clan name is required").max(120),
});

export type CreateClanInput = z.infer<typeof createClanSchema>;
