// src/schemas/wardOfficials.ts
import { z } from "zod";

export const createWardOfficialSchema = z.object({
  surname: z.string().trim().min(1, "Surname is required").max(100),
  given_name: z.string().trim().min(1, "Given name is required").max(100),
  gender: z.enum(["Male", "Female"]),
  date_of_birth: z
    .string()
    .min(1, "Date of birth is required")
    .refine((v) => !Number.isNaN(Date.parse(v)), "Invalid date format")
    .refine((v) => new Date(v) <= new Date(), "Date cannot be in the future")
    .optional()
    .nullable()
    .or(z.literal("")),
  official_type: z.string().trim().min(1, "Official type is required").max(200),
  position_status: z.string().trim().min(1, "Position/status is required").max(200),
  village_id: z.coerce.number().int().positive().optional().nullable().or(z.literal("")),
  phone: z.string().trim().max(50).optional().nullable().or(z.literal("")),
  email: z.string().trim().email("Invalid email").max(200).optional().nullable().or(z.literal("")),
  appointed_date: z
    .string()
    .refine((v) => !v || !Number.isNaN(Date.parse(v)), "Invalid date")
    .optional()
    .nullable()
    .or(z.literal("")),
  is_active: z.boolean().default(true),
});

export const updateWardOfficialSchema = createWardOfficialSchema;

export type CreateWardOfficialInput = z.infer<typeof createWardOfficialSchema>;
export type UpdateWardOfficialInput = z.infer<typeof updateWardOfficialSchema>;
