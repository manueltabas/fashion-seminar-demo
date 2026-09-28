import { sql } from "drizzle-orm";
import { getDb } from "./client";

export type DatabaseHealth = {
  ok: boolean;
  latencyMs: number;
  error?: string;
};

export async function checkDatabase(): Promise<DatabaseHealth> {
  const start = Date.now();
  try {
    await getDb().execute(sql`select 1`);
    return { ok: true, latencyMs: Date.now() - start };
  } catch (error) {
    return {
      ok: false,
      latencyMs: Date.now() - start,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
