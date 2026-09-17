const { readFile } = require('node:fs/promises');
const { join } = require('node:path');
const { Client } = require('pg');

async function main() {
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 5432),
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'millionx_ecommerce',
  });
  const sqlPath = join(process.cwd(), 'database/verify/phase1_verify.sql');
  const sql = await readFile(sqlPath, 'utf8');

  await client.connect();
  try {
    const queryResults = await client.query(sql);
    const results = Array.isArray(queryResults) ? queryResults : [queryResults];
    for (const result of results) {
      if (result.rows?.length > 0) console.table(result.rows);
    }
    console.log('Phase 1 database verification: PASS');
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(`Phase 1 database verification: FAIL — ${error.message}`);
  process.exitCode = 1;
});
