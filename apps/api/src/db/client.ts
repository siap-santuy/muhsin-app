import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const clients = new Set<postgres.Sql>();

export function createDb(databaseUrl = process.env.DATABASE_URL) {
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not set");
  }
  const client = postgres(databaseUrl);
  clients.add(client);
  return drizzle(client, { schema });
}

export type Db = ReturnType<typeof createDb>;

export async function closeDb() {
  await Promise.all([...clients].map((c) => c.end({ timeout: 3 })));
  clients.clear();
}