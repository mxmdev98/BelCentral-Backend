// src/services/users.ts — admin user management (create/disable officials, reset passwords)
import bcrypt from "bcryptjs";
import { pool } from "../db/pool.js";
import { badRequest, notFound, conflict } from "../utils/errors.js";

export interface User {
  id: number;
  username: string;
  role: "official" | "admin";
  is_active: boolean;
  created_at: string;
}

function mapRow(row: Record<string, unknown>): User {
  return {
    id: Number(row.id),
    username: String(row.username),
    role: row.role as "official" | "admin",
    is_active: Boolean(row.is_active),
    created_at: String(row.created_at),
  };
}

export async function listUsers(): Promise<User[]> {
  const { rows } = await pool.query(
    `SELECT id, username, role, is_active, created_at FROM users ORDER BY username ASC`
  );
  return rows.map(mapRow);
}

export async function createUser(
  username: string,
  password: string,
  role: "official" | "admin" = "official"
): Promise<User> {
  if (!username || username.length < 3) {
    throw badRequest("Username must be at least 3 characters", { username: "Min 3 characters" });
  }
  if (!password || password.length < 6) {
    throw badRequest("Password must be at least 6 characters", { password: "Min 6 characters" });
  }
  const hash = bcrypt.hashSync(password, 10);
  try {
    const { rows } = await pool.query(
      `INSERT INTO users (username, password_hash, role) VALUES ($1, $2, $3)
       RETURNING id, username, role, is_active, created_at`,
      [username, hash, role]
    );
    return mapRow(rows[0]);
  } catch (err: unknown) {
    if (err && typeof err === "object" && "code" in err && err.code === "23505") {
      throw conflict("A user with this username already exists.", { username: "Already taken" });
    }
    throw err;
  }
}

export async function resetPassword(userId: number, newPassword: string): Promise<void> {
  if (!newPassword || newPassword.length < 6) {
    throw badRequest("Password must be at least 6 characters", { password: "Min 6 characters" });
  }
  const hash = bcrypt.hashSync(newPassword, 10);
  const { rowCount } = await pool.query(
    `UPDATE users SET password_hash = $2 WHERE id = $1`,
    [userId, hash]
  );
  if (rowCount === 0) throw notFound("User not found");
}

export async function toggleUserActive(userId: number, isActive: boolean): Promise<User> {
  const { rows } = await pool.query(
    `UPDATE users SET is_active = $2 WHERE id = $1
     RETURNING id, username, role, is_active, created_at`,
    [userId, isActive]
  );
  if (!rows[0]) throw notFound("User not found");
  return mapRow(rows[0]);
}

export async function deleteUser(userId: number): Promise<void> {
  // Prevent admin from deleting themselves or the last admin
  const { rows } = await pool.query(`SELECT role FROM users WHERE id = $1`, [userId]);
  if (!rows[0]) throw notFound("User not found");
  if (rows[0].role === "admin") {
    const { rows: adminCount } = await pool.query(`SELECT COUNT(*)::int AS n FROM users WHERE role = 'admin' AND is_active = true`);
    if (adminCount[0].n <= 1) {
      throw badRequest("Cannot delete the last admin account");
    }
  }
  await pool.query(`DELETE FROM users WHERE id = $1`, [userId]);
}
