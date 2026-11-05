// src/services/permissions.ts
import { pool } from "../db/pool.js";
import { notFound } from "../utils/errors.js";

// The resources that can have permissions granted on them.
// Add new entries here when you add new tables to the app.
export const RESOURCES = ["residents", "ward_officials"] as const;
export type Resource = (typeof RESOURCES)[number];

export interface UserPermission {
  id: number;
  user_id: number;
  resource: string;
  can_read: boolean;
  can_create: boolean;
  can_update: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserWithPermissions {
  id: number;
  username: string;
  role: "official" | "admin";
  is_active: boolean;
  created_at: string;
  permissions: UserPermission[];
}

function mapPerm(row: Record<string, unknown>): UserPermission {
  return {
    id: Number(row.id),
    user_id: Number(row.user_id),
    resource: String(row.resource),
    can_read: Boolean(row.can_read),
    can_create: Boolean(row.can_create),
    can_update: Boolean(row.can_update),
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
  };
}

// ---- Permission checks (used by requirePermission middleware) ----

export async function hasPermission(
  userId: number,
  role: "official" | "admin",
  resource: string,
  action: "read" | "create" | "update"
): Promise<boolean> {
  // Admin bypasses all checks
  if (role === "admin") return true;

  const col = `can_${action}`;
  const { rows } = await pool.query(
    `SELECT ${col} FROM user_permissions WHERE user_id = $1 AND resource = $2`,
    [userId, resource]
  );
  if (!rows[0]) return false;
  return Boolean(rows[0][col]);
}

// ---- Permission management (admin only) ----

export async function listAllUsersWithPermissions(): Promise<UserWithPermissions[]> {
  const { rows: userRows } = await pool.query(
    `SELECT id, username, role, is_active, created_at FROM users ORDER BY username ASC`
  );
  const { rows: permRows } = await pool.query(
    `SELECT * FROM user_permissions ORDER BY user_id, resource`
  );
  const permsByUser = new Map<number, UserPermission[]>();
  for (const p of permRows) {
    const mapped = mapPerm(p);
    const arr = permsByUser.get(mapped.user_id) ?? [];
    arr.push(mapped);
    permsByUser.set(mapped.user_id, arr);
  }
  return userRows.map((u) => ({
    id: Number(u.id),
    username: String(u.username),
    role: u.role as "official" | "admin",
    is_active: Boolean(u.is_active),
    created_at: String(u.created_at),
    permissions: permsByUser.get(Number(u.id)) ?? [],
  }));
}

export async function getUserWithPermissions(userId: number): Promise<UserWithPermissions> {
  const { rows } = await pool.query(
    `SELECT id, username, role, is_active, created_at FROM users WHERE id = $1`,
    [userId]
  );
  if (!rows[0]) throw notFound("User not found");
  const u = rows[0];
  const { rows: permRows } = await pool.query(
    `SELECT * FROM user_permissions WHERE user_id = $1 ORDER BY resource`,
    [userId]
  );
  return {
    id: Number(u.id),
    username: String(u.username),
    role: u.role as "official" | "admin",
    is_active: Boolean(u.is_active),
    created_at: String(u.created_at),
    permissions: permRows.map(mapPerm),
  };
}

export interface PermissionUpdate {
  resource: string;
  can_read: boolean;
  can_create: boolean;
  can_update: boolean;
}

export async function upsertPermission(
  userId: number,
  update: PermissionUpdate
): Promise<UserPermission> {
  // Validate resource
  if (!RESOURCES.includes(update.resource as Resource)) {
    throw notFound(`Unknown resource '${update.resource}'`);
  }
  // Verify user exists
  const { rows: userCheck } = await pool.query(`SELECT id FROM users WHERE id = $1`, [userId]);
  if (!userCheck[0]) throw notFound("User not found");

  const { rows } = await pool.query(
    `INSERT INTO user_permissions (user_id, resource, can_read, can_create, can_update)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (user_id, resource) DO UPDATE SET
       can_read = EXCLUDED.can_read,
       can_create = EXCLUDED.can_create,
       can_update = EXCLUDED.can_update
     RETURNING *`,
    [userId, update.resource, update.can_read, update.can_create, update.can_update]
  );
  return mapPerm(rows[0]);
}

export async function deletePermission(userId: number, resource: string): Promise<void> {
  await pool.query(
    `DELETE FROM user_permissions WHERE user_id = $1 AND resource = $2`,
    [userId, resource]
  );
}
