import { Client } from 'pg';
import * as fs from 'fs';
import * as path from 'path';

// Parse .env file manually to avoid dependency issues
const envPath = path.resolve(__dirname, '../../.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const parts = trimmed.split('=');
    if (parts.length >= 2) {
      const key = parts[0].trim();
      let val = parts.slice(1).join('=').trim();
      // Remove surrounding quotes if any
      if (
        (val.startsWith('"') && val.endsWith('"')) ||
        (val.startsWith("'") && val.endsWith("'"))
      ) {
        val = val.slice(1, -1);
      }
      if (process.env[key] === undefined) {
        process.env[key] = val;
      }
    }
  });
}

async function runSeed() {
  const client = new Client({
    host: process.env.DATABASE_HOST || 'localhost',
    port: parseInt(process.env.DATABASE_PORT || '5432', 10),
    user: process.env.DATABASE_USERNAME || 'postgres',
    password: process.env.DATABASE_PASSWORD || 'postgres',
    database: process.env.DATABASE_NAME || 'jeroky_soft_db',
  });

  try {
    await client.connect();
    console.log('Successfully connected to database.');

    const seedSqlPath = path.resolve(__dirname, 'seed.sql');
    if (!fs.existsSync(seedSqlPath)) {
      throw new Error(`Seed file not found at: ${seedSqlPath}`);
    }

    console.log(`Reading SQL seed from: ${seedSqlPath}`);
    const sql = fs.readFileSync(seedSqlPath, 'utf8');

    console.log('Executing seed SQL script...');
    await client.query(sql);
    console.log('Seeding completed successfully!');
  } catch (error) {
    console.error('Error executing seed script:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runSeed().catch((err) => {
  console.error('Fatal database seeding error:', err);
  process.exit(1);
});
