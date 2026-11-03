// src/db/seed-admin.ts — idempotently creates the default admin user.
// Reads ADMIN_USERNAME / ADMIN_PASSWORD from .env (or defaults below).
import bcrypt from "bcryptjs";
import { pool } from "./pool.js";

async function main() {
  const username = process.env.ADMIN_USERNAME ?? "admin";
  const password = process.env.ADMIN_PASSWORD ?? "changeme123";

  const hash = bcrypt.hashSync(password, 10);

  const result = await pool.query(
    `INSERT INTO users (username, password_hash, role)
     VALUES ($1, $2, 'admin')
     ON CONFLICT (username) DO UPDATE
       SET password_hash = EXCLUDED.password_hash
     RETURNING id, username, role`,
    [username, hash]
  );

  const user = result.rows[0];
  console.log(`Admin user ready: id=${user.id} username=${user.username} role=${user.role}`);
  console.log(`Password set from ADMIN_PASSWORD env (default: changeme123).`);
  await pool.end();
}

main().catch((err) => {
  console.error("Seed admin failed:", err);
  process.exit(1);
});
