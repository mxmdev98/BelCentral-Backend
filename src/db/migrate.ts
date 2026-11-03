// src/db/migrate.ts — runs every .sql file in /migrations in filename order.
// Idempotent: relies on each migration being IF NOT EXISTS / ON CONFLICT.
// For a more robust migration tracker, add a `schema_migrations` table later.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { pool } from "./pool.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MIGRATIONS_DIR = path.resolve(__dirname, "../../migrations");

async function main() {
  const files = fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  if (files.length === 0) {
    console.log("No migration files found.");
    return;
  }

  for (const file of files) {
    const fullPath = path.join(MIGRATIONS_DIR, file);
    const sql = fs.readFileSync(fullPath, "utf8");
    console.log(`→ applying ${file}...`);
    await pool.query(sql);
    console.log(`  done: ${file}`);
  }
  console.log("All migrations applied.");
  await pool.end();
}

main().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
