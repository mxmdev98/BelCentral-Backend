// src/services/clans.ts
import { pool } from "../db/pool.js";
import { conflict, notFound } from "../utils/errors.js";
import type { CreateClanInput } from "../schemas/clans.js";

export interface Clan {
  id: number;
  tribe_id: number;
  name: string;
  created_at: string;
  resident_count?: number;
}

export async function listClans(tribeId?: number): Promise<Clan[]> {
  if (tribeId) {
    const { rows } = await pool.query(
      `SELECT id, tribe_id, name, created_at FROM clans
       WHERE tribe_id = $1 ORDER BY name ASC`,
      [tribeId]
    );
    return rows;
  }
  const { rows } = await pool.query(
    `SELECT id, tribe_id, name, created_at FROM clans ORDER BY name ASC`
  );
  return rows;
}

export async function getClan(id: number): Promise<Clan> {
  const { rows } = await pool.query(
    `SELECT id, tribe_id, name, created_at FROM clans WHERE id = $1`,
    [id]
  );
  if (!rows[0]) throw notFound("Clan not found");
  return rows[0];
}

export async function createClan(input: CreateClanInput): Promise<Clan> {
  try {
    const { rows } = await pool.query(
      `INSERT INTO clans (tribe_id, name) VALUES ($1, $2)
       RETURNING id, tribe_id, name, created_at`,
      [input.tribe_id, input.name]
    );
    return rows[0];
  } catch (err: unknown) {
    if (err && typeof err === "object" && "code" in err) {
      if (err.code === "23505") throw conflict("A clan with this name already exists in this tribe.");
      if (err.code === "23503") throw notFound("Referenced tribe does not exist.");
    }
    throw err;
  }
}

export async function updateClan(id: number, input: CreateClanInput): Promise<Clan> {
  try {
    const { rows } = await pool.query(
      `UPDATE clans SET tribe_id = $2, name = $3 WHERE id = $1
       RETURNING id, tribe_id, name, created_at`,
      [id, input.tribe_id, input.name]
    );
    if (!rows[0]) throw notFound("Clan not found");
    return rows[0];
  } catch (err: unknown) {
    if (err && typeof err === "object" && "code" in err) {
      if (err.code === "23505") throw conflict("A clan with this name already exists in this tribe.");
      if (err.code === "23503") throw notFound("Referenced tribe does not exist.");
    }
    throw err;
  }
}

export async function deleteClan(id: number): Promise<void> {
  const { rowCount } = await pool.query(`DELETE FROM clans WHERE id = $1`, [id]);
  if (rowCount === 0) throw notFound("Clan not found");
}
