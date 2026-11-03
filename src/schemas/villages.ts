// src/schemas/villages.ts
import { z } from "zod";

export const createVillageSchema = z.object({
  name: z.string().trim().min(1, "Village name is required").max(120),
});

export const updateVillageSchema = createVillageSchema;

export type CreateVillageInput = z.infer<typeof createVillageSchema>;
