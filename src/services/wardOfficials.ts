// src/services/wardOfficials.ts
import { pool } from "../db/pool.js";
import { notFound } from "../utils/errors.js";
import type { CreateWardOfficialInput, UpdateWardOfficialInput } from "../schemas/wardOfficials.js";

export interface WardOfficial {
  id: number;
  surname: string;
  given_name: string;
  gender: "Male" | "Female";
  date_of_birth: string | null;
  official_type: string;
  position_status: string;
  village_id: number | null;
  village_name?: string | null;
  phone: string | null;
  email: string | null;
  appointed_date: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const SELECT_COLS = `
  wo.id, wo.surname, wo.given_name, wo.gender, wo.date_of_birth,
  wo.official_type, wo.position_status,
  wo.village_id, wo.phone, wo.email, wo.appointed_date,
  wo.is_active, wo.created_at, wo.updated_at,
  v.name AS village_name
`;

function mapRow(row: Record<string, unknown>): WardOfficial {
  return {
    id: Number(row.id),
    surname: String(row.surname),
    given_name: String(row.given_name),
    gender: row.gender as "Male" | "Female",
    date_of_birth: row.date_of_birth ? String(row.date_of_birth).slice(0, 10) : null,
    official_type: String(row.official_type),
    position_status: String(row.position_status),
    village_id: row.village_id === null ? null : Number(row.village_id),
    village_name: row.village_name === null || row.village_name === undefined ? null : String(row.village_name),
    phone: row.phone === null ? null : String(row.phone),
    email: row.email === null ? null : String(row.email),
    appointed_date: row.appointed_date ? String(row.appointed_date).slice(0, 10) : null,
    is_active: Boolean(row.is_active),
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
  };
}

export async function listWardOfficials(activeOnly = false): Promise<WardOfficial[]> {
  const sql = activeOnly
    ? `SELECT ${SELECT_COLS} FROM ward_officials wo LEFT JOIN villages v ON v.id = wo.village_id WHERE wo.is_active = true ORDER BY wo.surname, wo.given_name`
    : `SELECT ${SELECT_COLS} FROM ward_officials wo LEFT JOIN villages v ON v.id = wo.village_id ORDER BY wo.surname, wo.given_name`;
  const { rows } = await pool.query(sql);
  return rows.map(mapRow);
}

export async function getWardOfficial(id: number): Promise<WardOfficial> {
  const { rows } = await pool.query(
    `SELECT ${SELECT_COLS} FROM ward_officials wo LEFT JOIN villages v ON v.id = wo.village_id WHERE wo.id = $1`,
    [id]
  );
  if (!rows[0]) throw notFound("Ward official not found");
  return mapRow(rows[0]);
}

export async function createWardOfficial(input: CreateWardOfficialInput): Promise<WardOfficial> {
  const { rows } = await pool.query(
    `INSERT INTO ward_officials (
       surname, given_name, gender, date_of_birth,
       official_type, position_status, village_id,
       phone, email, appointed_date, is_active
     ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
     RETURNING id`,
    [
      input.surname,
      input.given_name,
      input.gender,
      input.date_of_birth || null,
      input.official_type,
      input.position_status,
      input.village_id || null,
      input.phone || null,
      input.email || null,
      input.appointed_date || null,
      input.is_active,
    ]
  );
  return getWardOfficial(rows[0].id);
}

export async function updateWardOfficial(id: number, input: UpdateWardOfficialInput): Promise<WardOfficial> {
  await pool.query(
    `UPDATE ward_officials SET
       surname = $2, given_name = $3, gender = $4, date_of_birth = $5,
       official_type = $6, position_status = $7, village_id = $8,
       phone = $9, email = $10, appointed_date = $11, is_active = $12
     WHERE id = $1`,
    [
      id,
      input.surname,
      input.given_name,
      input.gender,
      input.date_of_birth || null,
      input.official_type,
      input.position_status,
      input.village_id || null,
      input.phone || null,
      input.email || null,
      input.appointed_date || null,
      input.is_active,
    ]
  );
  return getWardOfficial(id);
}

export async function deleteWardOfficial(id: number): Promise<void> {
  const { rowCount } = await pool.query(`DELETE FROM ward_officials WHERE id = $1`, [id]);
  if (rowCount === 0) throw notFound("Ward official not found");
}
