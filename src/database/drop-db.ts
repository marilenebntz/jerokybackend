import { Client } from 'pg';
import * as path from 'path';
import * as dotenv from 'dotenv';

// Load .env file if present
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

async function dropDatabase() {
  const envHost = process.env.DATABASE_HOST;
  const host = !envHost || envHost === 'localhost' ? '127.0.0.1' : envHost;
  const port = parseInt(process.env.DATABASE_PORT || '5432', 10);
  const user = process.env.DATABASE_USERNAME || 'postgres';
  const password = process.env.DATABASE_PASSWORD || 'password';
  const database = process.env.DATABASE_NAME || 'jeroky_soft_db';

  console.log(`[Drop DB] Connecting to PostgreSQL at ${host}:${port}/${database} as user '${user}'...`);

  const client = new Client({
    host,
    port,
    user,
    password,
    database,
  });

  try {
    await client.connect();
    console.log('[Drop DB] Database connection established.');

    console.log('[Drop DB] Dropping public schema and all objects (tables, enums, triggers, views)...');
    await client.query(`
      DROP SCHEMA IF EXISTS public CASCADE;
      CREATE SCHEMA public;
      GRANT ALL ON SCHEMA public TO ${user};
      GRANT ALL ON SCHEMA public TO public;
    `);

    console.log('✅ [Drop DB] Public schema dropped and recreated cleanly!');
  } catch (error) {
    console.error('❌ [Drop DB] Error dropping database schema:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

dropDatabase().catch((err) => {
  console.error('❌ [Drop DB] Fatal error:', err);
  process.exit(1);
});
