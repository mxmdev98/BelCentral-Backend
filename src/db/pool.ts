// src/db/pool.ts — shared pg connection pool
import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is not set. Copy .env.example to .env.");
}

// Tell the pg driver to return DATE columns as plain strings ("YYYY-MM-DD")
// instead of JS Date objects. This avoids timezone shifts and makes the
// value directly usable in <input type="date">.
// Must be set BEFORE creating the pool.
const types = pg.types;
types.setTypeParser(types.builtins.DATE, (val: string) => val); // return as-is "YYYY-MM-DD"
types.setTypeParser(types.builtins.TIMESTAMPTZ, (val: string) => val); // return as-is

export const pool = new pg.Pool({
  connectionString,
  max: Number(process.env.DB_POOL_MAX ?? 10),
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 5_000,
});

// Log slow queries (>500ms) in dev — cheap observability.
if (process.env.NODE_ENV !== "production") {
  pool.on("connect", (client) => {
    /* eslint-disable @typescript-eslint/no-explicit-any */
    const origQuery = client.query.bind(client) as any;
    (client as any).query = function (...args: any[]) {
      const start = Date.now();
      const result = origQuery(...args);
      if (result && typeof result.then === "function") {
        result.then(() => {
          const ms = Date.now() - start;
          if (ms > 500) {
            console.log(`[slow query ${ms}ms]`, args[0]);
          }
        });
      }
      return result;
    };
  });
}

// Helper for transactions: await withTransaction(async (client) => {...})
export async function withTransaction<T>(
  fn: (client: pg.PoolClient) => Promise<T>
): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await fn(client);
    await client.query("COMMIT");
    return result;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}
