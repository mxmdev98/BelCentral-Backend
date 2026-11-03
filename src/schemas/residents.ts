// src/schemas/residents.ts
import { z } from "zod";

export const genderEnum = z.enum(["Male", "Female"]);
export const employmentEnum = z.enum([
  "Employed",
  "Unemployed",
  "Student",
  "Retired",
  "Self-Employed",
]);
export const maritalEnum = z.enum(["Single", "Married", "Widowed", "Divorced", "Separated"]);
export const educationEnum = z.enum(["None", "Primary", "Secondary", "Vocational", "Tertiary"]);

// DOB must be a real date, not in the future, and not more than 130 years ago.
const dobField = z
  .string()
  .min(1, "Date of birth is required")
  .refine((v) => !Number.isNaN(Date.parse(v)), "Invalid date format")
  .refine((v) => new Date(v) <= new Date(), "Date of birth cannot be in the future")
  .refine((v) => new Date(v) >= new Date("1900-01-01"), "Date of birth is too far in the past");

export const createResidentSchema = z.object({
  full_name: z.string().trim().min(1, "Full name is required").max(200),
  father_name: z.string().trim().min(1, "Father's name is required").max(200),
  mother_name: z.string().trim().min(1, "Mother's name is required").max(200),
  gender: genderEnum,
  date_of_birth: dobField,
  village_id: z.coerce.number().int().positive("village_id is required"),
  tribe_id: z.coerce.number().int().positive("tribe_id is required"),
  clan_id: z.coerce.number().int().positive("clan_id is required"),
  employment_status: employmentEnum,
  marital_status: maritalEnum,
  education_level: educationEnum,
  profession: z.string().trim().max(200).optional().nullable(),
});

export const updateResidentSchema = createResidentSchema;

export type CreateResidentInput = z.infer<typeof createResidentSchema>;
export type UpdateResidentInput = z.infer<typeof updateResidentSchema>;

// Search query params (all optional, all coerced).
export const searchResidentsSchema = z.object({
  q: z.string().trim().optional(),
  father: z.string().trim().optional(),
  mother: z.string().trim().optional(),
  village_id: z.coerce.number().int().positive().optional(),
  tribe_id: z.coerce.number().int().positive().optional(),
  clan_id: z.coerce.number().int().positive().optional(),
  gender: genderEnum.optional(),
  employment_status: employmentEnum.optional(),
  marital_status: maritalEnum.optional(),
  education_level: educationEnum.optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(200).default(25),
});

export type SearchResidentsInput = z.infer<typeof searchResidentsSchema>;
