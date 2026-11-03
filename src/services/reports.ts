// src/services/reports.ts
import { pool } from "../db/pool.js";
import type { ReportType } from "../schemas/reports.js";

export interface ReportRow {
  label: string;
  sublabel?: string;
  count: number;
}

export interface ReportResult {
  type: ReportType;
  columns: string[];
  rows: ReportRow[];
}

const DELETED_FILTER = "r.deleted_at IS NULL";

async function runReport(
  type: ReportType,
  sql: string,
  params: unknown[] = [],
  columns: string[]
): Promise<ReportResult> {
  const { rows } = await pool.query(sql, params);
  return {
    type,
    columns,
    rows: rows.map((r) => ({
      label: String(r.label ?? ""),
      sublabel: r.sublabel === null || r.sublabel === undefined ? undefined : String(r.sublabel),
      count: Number(r.count),
    })),
  };
}

export async function getReport(type: ReportType): Promise<ReportResult> {
  switch (type) {
    case "residents_per_village":
      return runReport(
        type,
        `SELECT v.name AS label, COUNT(r.id)::int AS count
           FROM villages v
           LEFT JOIN residents r ON r.village_id = v.id AND ${DELETED_FILTER}
          GROUP BY v.id, v.name
          ORDER BY v.name`,
        [],
        ["Village", "Residents"]
      );

    case "gender_per_village":
      return runReport(
        type,
        `SELECT v.name AS label, r.gender AS sublabel, COUNT(r.id)::int AS count
           FROM villages v
           LEFT JOIN residents r ON r.village_id = v.id AND ${DELETED_FILTER}
          GROUP BY v.id, v.name, r.gender
          ORDER BY v.name, r.gender`,
        [],
        ["Village", "Gender", "Count"]
      );

    case "by_tribe_and_clan":
      return runReport(
        type,
        `SELECT t.name AS label, c.name AS sublabel, COUNT(r.id)::int AS count
           FROM tribes t
           JOIN villages v ON v.id = t.village_id
           LEFT JOIN clans c ON c.tribe_id = t.id
           LEFT JOIN residents r ON r.clan_id = c.id AND ${DELETED_FILTER}
          GROUP BY t.id, t.name, c.id, c.name
          ORDER BY v.name, t.name, c.name`,
        [],
        ["Tribe", "Clan", "Residents"]
      );

    case "by_employment":
      return runReport(
        type,
        `SELECT r.employment_status AS label, COUNT(*)::int AS count
           FROM residents r
          WHERE ${DELETED_FILTER}
          GROUP BY r.employment_status
          ORDER BY r.employment_status`,
        [],
        ["Employment Status", "Count"]
      );

    case "by_marital":
      return runReport(
        type,
        `SELECT r.marital_status AS label, COUNT(*)::int AS count
           FROM residents r
          WHERE ${DELETED_FILTER}
          GROUP BY r.marital_status
          ORDER BY r.marital_status`,
        [],
        ["Marital Status", "Count"]
      );

    case "by_education":
      return runReport(
        type,
        `SELECT r.education_level AS label, COUNT(*)::int AS count
           FROM residents r
          WHERE ${DELETED_FILTER}
          GROUP BY r.education_level
          ORDER BY r.education_level`,
        [],
        ["Education Level", "Count"]
      );

    case "age_distribution":
      return runReport(
        type,
        `SELECT
            CASE
              WHEN r.age BETWEEN 0  AND 17 THEN '0-17'
              WHEN r.age BETWEEN 18 AND 35 THEN '18-35'
              WHEN r.age BETWEEN 36 AND 60 THEN '36-60'
              WHEN r.age > 60              THEN '60+'
            END AS label,
            COUNT(*)::int AS count
           FROM residents r
          WHERE ${DELETED_FILTER}
          GROUP BY 1
          ORDER BY MIN(r.age)`,
        [],
        ["Age Group", "Count"]
      );

    default: {
      // Exhaustiveness check — TS will complain if a new ReportType is added.
      const _exhaustive: never = type;
      throw new Error(`Unknown report type: ${String(_exhaustive)}`);
    }
  }
}
