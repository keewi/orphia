import pg from "pg";
import { readFileSync } from "fs";

// Try multiple connection approaches
const PROJECT_REF = "vmixznbljfdcrfpikibv";
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SERVICE_ROLE_KEY) {
  console.error("Set SUPABASE_SERVICE_ROLE_KEY env var");
  process.exit(1);
}

const sql = readFileSync(
  new URL("../supabase/migration-social-mvp.sql", import.meta.url),
  "utf-8"
);

// Try connecting via the Supabase pooler with JWT auth (session mode, port 5432)
// Session mode supports DDL (CREATE TABLE, etc.)
const regions = [
  "aws-0-us-east-1",
  "aws-0-us-west-1",
  "aws-0-us-east-2",
];

async function tryConnect() {
  // First try direct connection
  const directConfig = {
    host: `db.${PROJECT_REF}.supabase.co`,
    port: 5432,
    database: "postgres",
    user: "postgres",
    password: SERVICE_ROLE_KEY,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 8000,
  };

  try {
    console.log("Trying direct connection...");
    const client = new pg.Client(directConfig);
    await client.connect();
    console.log("Connected directly!");
    return client;
  } catch (e) {
    console.log(`Direct failed: ${e.message}`);
  }

  // Try pooler with different regions
  for (const region of regions) {
    const poolerConfig = {
      host: `${region}.pooler.supabase.com`,
      port: 5432,
      database: "postgres",
      user: `postgres.${PROJECT_REF}`,
      password: SERVICE_ROLE_KEY,
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 8000,
    };

    try {
      console.log(`Trying pooler at ${region}...`);
      const client = new pg.Client(poolerConfig);
      await client.connect();
      console.log(`Connected via pooler ${region}!`);
      return client;
    } catch (e) {
      console.log(`Pooler ${region} failed: ${e.message}`);
    }
  }

  return null;
}

const client = await tryConnect();
if (!client) {
  console.error("Could not connect to database with any method.");
  process.exit(1);
}

try {
  console.log("\nRunning migration...\n");
  await client.query(sql);
  console.log("Migration completed successfully!");

  // Verify tables exist
  const { rows } = await client.query(`
    SELECT table_name FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name IN ('profiles', 'follows')
    ORDER BY table_name
  `);
  console.log("\nVerified tables:", rows.map((r) => r.table_name).join(", "));
} catch (e) {
  console.error("Migration error:", e.message);
} finally {
  await client.end();
}
