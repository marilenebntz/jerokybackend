import { Client } from 'pg';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

// Load .env file if present
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

async function runSeed() {
  const envHost = process.env.DATABASE_HOST;
  const host = !envHost || envHost === 'localhost' ? '127.0.0.1' : envHost;
  const port = parseInt(process.env.DATABASE_PORT || '5432', 10);
  const user = process.env.DATABASE_USERNAME || 'postgres';
  const password = process.env.DATABASE_PASSWORD || 'password';
  const database = process.env.DATABASE_NAME || 'jeroky_soft_db';

  console.log(`[Seed] Connecting to PostgreSQL at ${host}:${port}/${database} as user '${user}'...`);

  const client = new Client({
    host,
    port,
    user,
    password,
    database,
  });

  try {
    await client.connect();
    console.log('[Seed] Database connection established successfully.');

    const seedSqlPath = path.resolve(__dirname, 'seed.sql');
    if (!fs.existsSync(seedSqlPath)) {
      throw new Error(`Seed file not found at: ${seedSqlPath}`);
    }

    console.log(`[Seed] Reading SQL script from: ${seedSqlPath}`);
    const sql = fs.readFileSync(seedSqlPath, 'utf8');

    console.log('[Seed] Executing seed SQL statements...');
    await client.query(sql);
    console.log('✅ [Seed] Database seeding completed successfully!');
  } catch (error) {
    console.error('❌ [Seed] Error executing seed script:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runSeed().catch((err) => {
  console.error('❌ [Seed] Fatal database seeding error:', err);
  process.exit(1);
});

