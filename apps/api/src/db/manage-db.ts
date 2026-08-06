import postgres from "postgres";

const mode = process.argv[2];

const url = process.env.DATABASE_URL;
if (!url) {
  throw new Error("DATABASE_URL is not set");
}

const match = url.match(/^postgres:\/\/([^:@]+)(?::([^@]*))?@([^/]+)\/(.+)$/);
if (!match) {
  throw new Error(`Cannot parse DATABASE_URL: ${url}`);
}

const [, user, password, host, rawDb] = match;
const database = rawDb.split("?")[0];
const adminUrl = `postgres://${user}${password ? `:${password}` : ""}@${host}/postgres`;

async function exists(db: postgres.Sql): Promise<boolean> {
  const rows = await db`SELECT 1 FROM pg_database WHERE datname = ${database}`;
  return rows.length > 0;
}

async function create(): Promise<void> {
  const db = postgres(adminUrl, { max: 1, onnotice: () => {} });
  try {
    if (await exists(db)) {
      console.log(`[db] database "${database}" already exists`);
      return;
    }
    await db.unsafe(`CREATE DATABASE "${database}"`);
    console.log(`[db] created database "${database}"`);
  } finally {
    await db.end();
  }
}

async function drop(): Promise<void> {
  const db = postgres(adminUrl, { max: 1, onnotice: () => {} });
  try {
    await db.unsafe(`DROP DATABASE IF EXISTS "${database}" WITH (FORCE)`);
    console.log(`[db] dropped database "${database}"`);
  } finally {
    await db.end();
  }
}

async function main() {
  if (mode === "create") {
    await create();
  } else if (mode === "reset") {
    await drop();
    await create();
  } else {
    throw new Error(`Unknown mode "${mode}". Use "create" or "reset".`);
  }
}

main().catch((err) => {
  console.error("[db] failed:", err);
  process.exit(1);
});
