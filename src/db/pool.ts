// src/db/pool.ts — shared pg connection pool
import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is not set. Copy .env.example to .env.");
}

export const pool = new pg.Pool({
  connectionString,
  // Default pool size (10) is plenty for a small LLG app.
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
      // Both callback and promise styles are supported by pg; we only
      // await the promise form here.
      if (result && typeof result.then === "function") {
        result.then(() => {
          const ms = Date.now() - start;
          if (ms > 500) {
            // eslint-disable-next-line no-console
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
