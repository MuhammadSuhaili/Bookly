import { drizzle } from "drizzle-orm/node-postgres";
import { Pool, type PoolClient } from "pg";
import * as schema from "./schema";

const globalForDb = globalThis as unknown as {
  pgPool?: Pool;
};

function getPool(): Pool {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL environment variable is not set.");
  }

  if (!globalForDb.pgPool) {
    globalForDb.pgPool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 10,
      connectionTimeoutMillis: 10_000,
    });
  }
  return globalForDb.pgPool;
}

const pool = getPool();

export const db = drizzle(pool, { schema });

/** Get a dedicated client (used for multi-statement transactions/locking). */
export async function getClient(): Promise<PoolClient> {
  return pool.connect();
}

export type DbClient = PoolClient;

/** Release the client back to the pool. */
export function releaseClient(client: PoolClient): void {
  client.release();
}

export { schema };
