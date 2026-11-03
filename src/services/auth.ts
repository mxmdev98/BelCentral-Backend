// src/services/auth.ts
import bcrypt from "bcryptjs";
import { pool } from "../db/pool.js";
import { unauthorized } from "../utils/errors.js";
import { signToken, type AuthUser } from "../utils/jwt.js";
import type { LoginInput } from "../schemas/auth.js";

export async function login(input: LoginInput): Promise<{ token: string; user: AuthUser }> {
  const { rows } = await pool.query(
    `SELECT id, username, password_hash, role FROM users WHERE username = $1`,
    [input.username]
  );
  const row = rows[0];
  if (!row) throw unauthorized("Invalid username or password");

  const ok = bcrypt.compareSync(input.password, row.password_hash);
  if (!ok) throw unauthorized("Invalid username or password");

  const user: AuthUser = { id: row.id, username: row.username, role: row.role };
  const token = signToken(user);
  return { token, user };
}

export async function me(userId: number): Promise<AuthUser> {
  const { rows } = await pool.query(
    `SELECT id, username, role FROM users WHERE id = $1`,
    [userId]
  );
  const row = rows[0];
  if (!row) throw unauthorized("User not found");
  return { id: row.id, username: row.username, role: row.role };
}
