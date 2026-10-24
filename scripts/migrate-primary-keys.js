'use strict';
const { readFileSync, mkdirSync, statSync, chmodSync } = require('node:fs');
const { join, dirname, isAbsolute } = require('node:path');
const { spawnSync } = require('node:child_process');
const { Client } = require('pg');

const migrationPath = join(
  __dirname,
  '../database/migrations/20261025_primary_keys_to_underscore_id.sql',
);

function sqlForMode(sql, apply) {
  if (!/\bCOMMIT;\s*$/.test(sql)) throw new Error('Migration must end with COMMIT');
  return apply ? sql : sql.replace(/\bCOMMIT;\s*$/, 'ROLLBACK;');
}

function backupDatabase() {
  const bin = process.env.PG_DUMP_BIN;
  if (!bin || !isAbsolute(bin))
    throw new Error('Set PG_DUMP_BIN to an absolute compatible pg_dump binary path');
  const directory = join(__dirname, '../.database-backups');
  mkdirSync(directory, { recursive: true, mode: 0o700 });
  chmodSync(directory, 0o700);
  const filename = join(
    directory,
    `millionx-before-pk-rename-${new Date().toISOString().replace(/[:.]/g, '-')}.dump`,
  );
  const result = spawnSync(bin, ['--format=custom', '--no-owner', '--no-acl', '--file', filename], {
    env: {
      ...process.env,
      PGHOST: process.env.DB_HOST,
      PGPORT: process.env.DB_PORT || '5432',
      PGUSER: process.env.DB_USER,
      PGPASSWORD: process.env.DB_PASSWORD,
      PGDATABASE: process.env.DB_NAME,
    },
    encoding: 'utf8',
    timeout: 60000,
  });
  if (result.error || result.status !== 0)
    throw new Error(`Database backup failed: ${result.error?.message || result.stderr}`);
  if (statSync(filename).size < 1000) throw new Error('Database backup is unexpectedly small');
  chmodSync(filename, 0o600);
  const check = spawnSync(join(dirname(bin), 'pg_restore'), ['--list', filename], {
    encoding: 'utf8',
    timeout: 10000,
  });
  if (check.error || check.status !== 0)
    throw new Error('pg_restore could not read the backup archive');
  return filename;
}

async function main() {
  const args = process.argv.slice(2);
  if (args.length > 1 || args.some((arg) => !['--apply', '--dry-run'].includes(arg)))
    throw new Error('Use --dry-run (default) or --apply');
  const apply = args.includes('--apply');
  if (process.env.DB_NAME !== 'millionx_ecommerce')
    throw new Error('Refusing a database other than millionx_ecommerce');
  // A real backup is mandatory for apply; no seed, reset, or password update is performed.
  const backup = apply ? backupDatabase() : null;
  const client = new Client({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 5432),
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    connectionTimeoutMillis: 5000,
  });
  try {
    await client.connect();
    const results = await client.query(sqlForMode(readFileSync(migrationPath, 'utf8'), apply));
    const audit =
      (Array.isArray(results) ? results : [results]).find((result) => result.rows?.[0]?.data_status)
        ?.rows || [];
    console.log(
      JSON.stringify(
        {
          mode: apply ? 'apply' : 'dry-run (rolled back)',
          database: process.env.DB_NAME,
          backup,
          audit,
        },
        null,
        2,
      ),
    );
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    throw error;
  } finally {
    await client.end();
  }
}
module.exports = { sqlForMode };
if (require.main === module)
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
