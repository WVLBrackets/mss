import { neon } from "@neondatabase/serverless";
import { getPostgresUrl } from "@/lib/databaseConfig";

let sqlInstance: ReturnType<typeof neon> | null = null;

function getNeonSql(): ReturnType<typeof neon> {
  if (!sqlInstance) {
    sqlInstance = neon(getPostgresUrl());
  }
  return sqlInstance;
}

/**
 * Parameterized SQL via Neon serverless (tagged template literals).
 * Same usage pattern as portfolio `@vercel/postgres` examples.
 */
export function sql(strings: TemplateStringsArray, ...values: unknown[]) {
  return getNeonSql()(strings, ...values);
}
