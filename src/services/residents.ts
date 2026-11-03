// src/services/residents.ts
import { pool } from "../db/pool.js";
import { computeAge } from "../utils/age.js";
import { badRequest, notFound } from "../utils/errors.js";
import type {
  CreateResidentInput,
  SearchResidentsInput,
  UpdateResidentInput,
} from "../schemas/residents.js";

export interface Resident {
  id: string;
  full_name: string;
  father_name: string;
  mother_name: string;
  gender: "Male" | "Female";
  date_of_birth: string;       // ISO date
  age: number;
  village_id: number;
  tribe_id: number;
  clan_id: number;
  employment_status: string;
  marital_status: string;
  education_level: string;
  profession: string | null;
  created_by: number | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface ResidentDetail extends Resident {
  village_name: string;
  tribe_name: string;
  clan_name: string;
}

export interface ResidentListRow extends Resident {
  village_name: string;
  tribe_name: string;
  clan_name: string;
}

// Validate that tribe belongs to the chosen village, and clan belongs to the tribe.
// Throws badRequest(400) with field-level details if the hierarchy is inconsistent.
async function assertHierarchy(
  villageId: number,
  tribeId: number,
  clanId: number
): Promise<void> {
  const { rows } = await pool.query(
    `SELECT t.id AS tribe_id, t.village_id AS tribe_village_id,
            c.id AS clan_id,   c.tribe_id  AS clan_tribe_id
       FROM tribes t
       LEFT JOIN clans c ON c.id = $3
      WHERE t.id = $2`,
    [villageId, tribeId, clanId]
  );
  const tribe = rows[0];
  if (!tribe) {
    throw badRequest("Invalid tribe.", { tribe_id: "Tribe does not exist." });
  }
  if (tribe.tribe_village_id !== villageId) {
    throw badRequest("Tribe does not belong to the selected village.", {
      tribe_id: "Tribe does not belong to the selected village.",
    });
  }
  if (!tribe.clan_id) {
    throw badRequest("Invalid clan.", { clan_id: "Clan does not exist." });
  }
  if (tribe.clan_tribe_id !== tribeId) {
    throw badRequest("Clan does not belong to the selected tribe.", {
      clan_id: "Clan does not belong to the selected tribe.",
    });
  }
}

function mapRow(row: Record<string, unknown>): Resident {
  return {
    id: String(row.id),
    full_name: String(row.full_name),
    father_name: String(row.father_name),
    mother_name: String(row.mother_name),
    gender: row.gender as "Male" | "Female",
    date_of_birth: String(row.date_of_birth).slice(0, 10),
    age: Number(row.age),
    village_id: Number(row.village_id),
    tribe_id: Number(row.tribe_id),
    clan_id: Number(row.clan_id),
    employment_status: String(row.employment_status),
    marital_status: String(row.marital_status),
    education_level: String(row.education_level),
    profession: row.profession === null ? null : String(row.profession),
    created_by: row.created_by === null ? null : Number(row.created_by),
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
    deleted_at: row.deleted_at === null ? null : String(row.deleted_at),
  };
}

const SELECT_COLS = `
  r.id, r.full_name, r.father_name, r.mother_name, r.gender,
  r.date_of_birth, r.age,
  r.village_id, r.tribe_id, r.clan_id,
  r.employment_status, r.marital_status, r.education_level,
  r.profession, r.created_by, r.created_at, r.updated_at, r.deleted_at,
  v.name AS village_name,
  t.name AS tribe_name,
  c.name AS clan_name
`;

export async function searchResidents(
  input: SearchResidentsInput
): Promise<{ items: ResidentListRow[]; total: number; page: number; limit: number }> {
  const where: string[] = ["r.deleted_at IS NULL"];
  const params: unknown[] = [];

  if (input.q) {
    params.push(`%${input.q}%`);
    const p = params.length;
    where.push(`(r.full_name ILIKE $${p} OR r.father_name ILIKE $${p} OR r.mother_name ILIKE $${p})`);
  }
  if (input.father) { params.push(`%${input.father}%`); where.push(`r.father_name ILIKE $${params.length}`); }
  if (input.mother) { params.push(`%${input.mother}%`); where.push(`r.mother_name ILIKE $${params.length}`); }
  if (input.village_id) { params.push(input.village_id); where.push(`r.village_id = $${params.length}`); }
  if (input.tribe_id)   { params.push(input.tribe_id);   where.push(`r.tribe_id   = $${params.length}`); }
  if (input.clan_id)    { params.push(input.clan_id);    where.push(`r.clan_id    = $${params.length}`); }
  if (input.gender)     { params.push(input.gender);     where.push(`r.gender     = $${params.length}`); }
  if (input.employment_status) { params.push(input.employment_status); where.push(`r.employment_status = $${params.length}`); }
  if (input.marital_status)    { params.push(input.marital_status);    where.push(`r.marital_status    = $${params.length}`); }
  if (input.education_level)   { params.push(input.education_level);   where.push(`r.education_level   = $${params.length}`); }

  const whereSql = where.join(" AND ");

  // Count
  const countSql = `SELECT COUNT(*)::int AS total FROM residents r WHERE ${whereSql}`;
  const { rows: countRows } = await pool.query(countSql, params);
  const total = countRows[0].total;

  // Page
  const offset = (input.page - 1) * input.limit;
  const limitParam = params.length + 1;
  const offsetParam = params.length + 2;
  const listSql = `
    SELECT ${SELECT_COLS}
    FROM residents r
    JOIN villages v ON v.id = r.village_id
    JOIN tribes   t ON t.id = r.tribe_id
    JOIN clans    c ON c.id = r.clan_id
    WHERE ${whereSql}
    ORDER BY r.full_name ASC
    LIMIT $${limitParam} OFFSET $${offsetParam}
  `;
  const { rows } = await pool.query(listSql, [...params, input.limit, offset]);
  return {
    items: rows.map((r) => ({ ...mapRow(r), village_name: String(r.village_name), tribe_name: String(r.tribe_name), clan_name: String(r.clan_name) })),
    total,
    page: input.page,
    limit: input.limit,
  };
}

export async function getResident(id: string): Promise<ResidentDetail> {
  const { rows } = await pool.query(
    `SELECT ${SELECT_COLS}
     FROM residents r
     JOIN villages v ON v.id = r.village_id
     JOIN tribes   t ON t.id = r.tribe_id
     JOIN clans    c ON c.id = r.clan_id
     WHERE r.id = $1 AND r.deleted_at IS NULL`,
    [id]
  );
  if (!rows[0]) throw notFound("Resident not found");
  const r = rows[0];
  return {
    ...mapRow(r),
    village_name: String(r.village_name),
    tribe_name: String(r.tribe_name),
    clan_name: String(r.clan_name),
  };
}

export async function createResident(
  input: CreateResidentInput,
  createdBy: number
): Promise<ResidentDetail> {
  await assertHierarchy(input.village_id, input.tribe_id, input.clan_id);
  const age = computeAge(input.date_of_birth);

  const { rows } = await pool.query(
    `INSERT INTO residents (
       full_name, father_name, mother_name, gender, date_of_birth, age,
       village_id, tribe_id, clan_id,
       employment_status, marital_status, education_level, profession,
       created_by
     )
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
     RETURNING id`,
    [
      input.full_name, input.father_name, input.mother_name, input.gender,
      input.date_of_birth, age,
      input.village_id, input.tribe_id, input.clan_id,
      input.employment_status, input.marital_status, input.education_level,
      input.profession ?? null,
      createdBy,
    ]
  );
  // Unique violation is caught by error middleware → 409 friendly message.
  return getResident(rows[0].id);
}

export async function updateResident(
  id: string,
  input: UpdateResidentInput
): Promise<ResidentDetail> {
  // Make sure the resident exists & is not soft-deleted.
  const existing = await getResident(id);
  if (!existing) throw notFound("Resident not found");

  await assertHierarchy(input.village_id, input.tribe_id, input.clan_id);
  const age = computeAge(input.date_of_birth);

  await pool.query(
    `UPDATE residents SET
       full_name = $2, father_name = $3, mother_name = $4, gender = $5,
       date_of_birth = $6, age = $7,
       village_id = $8, tribe_id = $9, clan_id = $10,
       employment_status = $11, marital_status = $12, education_level = $13,
       profession = $14
     WHERE id = $1 AND deleted_at IS NULL`,
    [
      id,
      input.full_name, input.father_name, input.mother_name, input.gender,
      input.date_of_birth, age,
      input.village_id, input.tribe_id, input.clan_id,
      input.employment_status, input.marital_status, input.education_level,
      input.profession ?? null,
    ]
  );
  return getResident(id);
}

export async function softDeleteResident(id: string): Promise<void> {
  const { rowCount } = await pool.query(
    `UPDATE residents SET deleted_at = now() WHERE id = $1 AND deleted_at IS NULL`,
    [id]
  );
  if (rowCount === 0) throw notFound("Resident not found");
}
