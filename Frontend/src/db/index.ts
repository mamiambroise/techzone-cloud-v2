import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is required");
}

const globalForDb = globalThis as typeof globalThis & {
  __arenaNextJsPostgresqlPool?: Pool;
};

export const pool =
  globalForDb.__arenaNextJsPostgresqlPool ??
  new Pool({
    connectionString: databaseUrl,
  });

if (process.env.NODE_ENV !== "production") {
  globalForDb.__arenaNextJsPostgresqlPool = pool;
}

export const db = drizzle(pool);

// Structural type covering both the top-level `db` and the `tx` handle passed into
// `db.transaction(async (tx) => ...)`. Services accept this so a caller can run a
// sequence of operations either standalone or atomically inside one transaction.
export type DbOrTx = typeof db | Parameters<Parameters<typeof db.transaction>[0]>[0];
