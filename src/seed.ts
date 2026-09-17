import * as fs from 'fs';
import * as path from 'path';
import * as bcrypt from 'bcrypt';
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

async function seed() {
  loadEnvFile();
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 5435),
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'millionx_ecommerce',
  });

  await client.connect();
  try {
    const adminPassword = process.env.SEED_ADMIN_PASSWORD || 'ChangeMe123!';
    const adminUsername = process.env.SEED_ADMIN_USERNAME || 'admin';
    const passwordHash = await bcrypt.hash(adminPassword, 12);
    await client.query(
      `INSERT INTO ecommerce.users (username,password,role,"isActive")
       VALUES ($1,$2,'admin','active')
       ON CONFLICT (username) DO UPDATE SET
         password = EXCLUDED.password,
         role = EXCLUDED.role,
         "isActive" = EXCLUDED."isActive",
         "updatedAt" = NOW()`,
      [adminUsername, passwordHash],
    );

    for (const [uniqueId, name] of [
      [1, 'ນະຄອນຫຼວງວຽງຈັນ'],
      [2, 'ເຂດພາກເໜືອ'],
      [3, 'ເຂດພາກໃຕ້'],
    ] as const) {
      const updated = await client.query(
        `UPDATE ecommerce.zones
         SET name = $2, "isActive" = 'active', "updatedAt" = now()
         WHERE "uniqueId" = $1
         RETURNING _id`,
        [uniqueId, name],
      );
      if (updated.rowCount === 0) {
        await client.query(
          `INSERT INTO ecommerce.zones ("uniqueId",name,"isActive")
           VALUES ($1,$2,'active') ON CONFLICT (name) DO NOTHING`,
          [uniqueId, name],
        );
      }
    }

    const catalogSeed = fs.readFileSync(
      path.join(process.cwd(), 'database/seeds/01_foundation_seed.sql'),
      'utf8',
    );
    await client.query(catalogSeed);
    const customerEmail = (process.env.SEED_CUSTOMER_EMAIL || 'demo.customer@example.com')
      .trim()
      .toLowerCase();
    const customerPassword = process.env.SEED_CUSTOMER_PASSWORD || 'Customer123!';
    const customerPasswordHash = await bcrypt.hash(customerPassword, 12);
    const customer = await client.query<{ id: string }>(
      `SELECT id FROM ecommerce.customers
       WHERE lower(email) IN (lower($1), lower('demo.customer@example.com'))
       ORDER BY (lower(email) = lower($1)) DESC
       LIMIT 1`,
      [customerEmail],
    );
    if (customer.rowCount === 0) {
      throw new Error('Development customer was not created');
    }
    const customerId = customer.rows[0].id;
    await client.query(
      `UPDATE ecommerce.customers SET email = $1, "updatedAt" = now()
       WHERE id = $2`,
      [customerEmail, customerId],
    );
    await client.query(
      `INSERT INTO ecommerce.customer_accounts ("customerId","passwordHash")
       VALUES ($1,$2)
       ON CONFLICT ("customerId") DO UPDATE SET
         "passwordHash" = EXCLUDED."passwordHash",
         "isActive" = true,
         "updatedAt" = now()`,
      [customerId, customerPasswordHash],
    );
    console.log(
      'Seed complete: staff admin, customer account, zones and E-commerce Phase 1 demo data.',
    );
    if (!process.env.SEED_ADMIN_PASSWORD) {
      console.warn('Development admin password: ChangeMe123! — change it immediately.');
    }
    if (!process.env.SEED_CUSTOMER_PASSWORD) {
      console.warn('Development customer password: Customer123! — change it immediately.');
    }
  } finally {
    await client.end();
  }
}

seed().catch((error) => {
  console.error(error);
  process.exit(1);
});
