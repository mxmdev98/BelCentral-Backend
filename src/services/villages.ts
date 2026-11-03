// src/services/villages.ts
import { pool } from "../db/pool.js";
import { conflict, notFound } from "../utils/errors.js";
import type { CreateVillageInput } from "../schemas/villages.js";

export interface Village {
  id: number;
  name: string;
  created_at: string;
  tribe_count?: number;
  resident_count?: number;
}

export async function listVillages(withCounts = false): Promise<Village[]> {
  if (!withCounts) {
    const { rows } = await pool.query(
      `SELECT id, name, created_at FROM villages ORDER BY name ASC`
    );
    return rows;
  }
  const { rows } = await pool.query(`
    SELECT v.id, v.name, v.created_at,
      COUNT(DISTINCT t.id)            AS tribe_count,
      COUNT(DISTINCT r.id) FILTER (WHERE r.deleted_at IS NULL) AS resident_count
    FROM villages v
    LEFT JOIN tribes t    ON t.village_id = v.id
    LEFT JOIN residents r ON r.village_id = v.id
    GROUP BY v.id
    ORDER BY v.name ASC
  `);
  return rows.map((r) => ({
    ...r,
    tribe_count: Number(r.tribe_count),
    resident_count: Number(r.resident_count),
  }));
}

export async function getVillage(id: number): Promise<Village> {
  const { rows } = await pool.query(
    `SELECT id, name, created_at FROM villages WHERE id = $1`,
    [id]
  );
  if (!rows[0]) throw notFound("Village not found");
  return rows[0];
}

export async function createVillage(input: CreateVillageInput): Promise<Village> {
  try {
    const { rows } = await pool.query(
      `INSERT INTO villages (name) VALUES ($1)
       RETURNING id, name, created_at`,
      [input.name]
    );
    return rows[0];
  } catch (err: unknown) {
    if (err && typeof err === "object" && "code" in err && err.code === "23505") {
      throw conflict("A village with this name already exists.");
    }
    throw err;
  }
}

export async function updateVillage(id: number, input: CreateVillageInput): Promise<Village> {
  try {
    const { rows } = await pool.query(
      `UPDATE villages SET name = $2 WHERE id = $1
       RETURNING id, name, created_at`,
      [id, input.name]
    );
    if (!rows[0]) throw notFound("Village not found");
    return rows[0];
  } catch (err: unknown) {
    if (err && typeof err === "object" && "code" in err && err.code === "23505") {
      throw conflict("A village with this name already exists.");
    }
    throw err;
  }
}

export async function deleteVillage(id: number): Promise<void> {
  // RESTRICT FK on tribes/residents will block if any depend on this village.
  const { rowCount } = await pool.query(`DELETE FROM villages WHERE id = $1`, [id]);
  if (rowCount === 0) throw notFound("Village not found");
}
