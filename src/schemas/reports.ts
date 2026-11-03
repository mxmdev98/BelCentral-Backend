// src/schemas/reports.ts
import { z } from "zod";

export const reportTypeSchema = z.enum([
  "residents_per_village",
  "gender_per_village",
  "by_tribe_and_clan",
  "by_employment",
  "by_marital",
  "by_education",
  "age_distribution",
]);

export type ReportType = z.infer<typeof reportTypeSchema>;
