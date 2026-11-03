// src/db/migrate.ts — runs every .sql file in /migrations in filename order.
// Idempotent: relies on each migration being IF NOT EXISTS / ON CONFLICT.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { pool } from "./pool.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Try several candidate locations so this works in dev (tsx) AND in the
// Docker container (compiled JS + migrations copied to /app/migrations).
function findMigrationsDir(): string {
  const candidates = [
    path.resolve(__dirname, "../../migrations"),   // dev: src/db/ -> ../../migrations
    path.resolve(__dirname, "../../../migrations"), // compiled: dist/db/ -> ../../../migrations (when migrations is at project root)
    path.resolve(process.cwd(), "migrations"),     // Docker: /app/migrations
    "/app/migrations",                              // Docker absolute fallback
  ];
  for (const c of candidates) {
    if (fs.existsSync(c)) return c;
  }
  throw new Error(`Could not find migrations directory. Tried: ${candidates.join(", ")}`);
}

async function main() {
  const MIGRATIONS_DIR = findMigrationsDir();
  console.log(`Looking for migrations in: ${MIGRATIONS_DIR}`);

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
