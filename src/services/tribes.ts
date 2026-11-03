// src/services/tribes.ts
import { pool } from "../db/pool.js";
import { conflict, notFound } from "../utils/errors.js";
import type { CreateTribeInput } from "../schemas/tribes.js";

export interface Tribe {
  id: number;
  village_id: number;
  name: string;
  created_at: string;
  clan_count?: number;
  resident_count?: number;
}

export async function listTribes(villageId?: number): Promise<Tribe[]> {
  if (villageId) {
    const { rows } = await pool.query(
      `SELECT id, village_id, name, created_at FROM tribes
       WHERE village_id = $1 ORDER BY name ASC`,
      [villageId]
    );
    return rows;
  }
  const { rows } = await pool.query(
    `SELECT id, village_id, name, created_at FROM tribes ORDER BY name ASC`
  );
  return rows;
}

export async function getTribe(id: number): Promise<Tribe> {
  const { rows } = await pool.query(
    `SELECT id, village_id, name, created_at FROM tribes WHERE id = $1`,
    [id]
  );
  if (!rows[0]) throw notFound("Tribe not found");
  return rows[0];
}

export async function createTribe(input: CreateTribeInput): Promise<Tribe> {
  try {
    const { rows } = await pool.query(
      `INSERT INTO tribes (village_id, name) VALUES ($1, $2)
       RETURNING id, village_id, name, created_at`,
      [input.village_id, input.name]
    );
    return rows[0];
  } catch (err: unknown) {
    if (err && typeof err === "object" && "code" in err) {
      if (err.code === "23505") throw conflict("A tribe with this name already exists in this village.");
      if (err.code === "23503") throw notFound("Referenced village does not exist.");
    }
    throw err;
  }
}

export async function updateTribe(id: number, input: CreateTribeInput): Promise<Tribe> {
  try {
    const { rows } = await pool.query(
      `UPDATE tribes SET village_id = $2, name = $3 WHERE id = $1
       RETURNING id, village_id, name, created_at`,
      [id, input.village_id, input.name]
    );
    if (!rows[0]) throw notFound("Tribe not found");
    return rows[0];
  } catch (err: unknown) {
    if (err && typeof err === "object" && "code" in err) {
      if (err.code === "23505") throw conflict("A tribe with this name already exists in this village.");
      if (err.code === "23503") throw notFound("Referenced village does not exist.");
    }
    throw err;
  }
}

export async function deleteTribe(id: number): Promise<void> {
  const { rowCount } = await pool.query(`DELETE FROM tribes WHERE id = $1`, [id]);
  if (rowCount === 0) throw notFound("Tribe not found");
}
