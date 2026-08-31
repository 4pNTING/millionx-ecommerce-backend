import * as fs from 'fs';
import * as path from 'path';
import { Client } from 'pg';

function loadEnvFile() {
  const envPath = path.join(process.cwd(), '.env');
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const value = line.trim();
    if (!value || value.startsWith('#')) continue;
    const separator = value.indexOf('=');
    if (separator < 1) continue;
    const key = value.slice(0, separator).trim();
    if (!process.env[key]) process.env[key] = value.slice(separator + 1).trim();
  }
}

async function migrate() {
  loadEnvFile();
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 5432),
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'millionx_ecommerce',
  });
  await client.connect();
  try {
    const sql = fs.readFileSync(
      path.join(process.cwd(), 'database/migrations/20260823_phase1_customer_accounts.sql'),
      'utf8',
    );
    await client.query(sql);
    console.log('Migration complete: staff users and customer accounts are separated.');
  } finally {
    await client.end();
  }
}

migrate().catch((error) => {
  console.error(error);
  process.exit(1);
});
