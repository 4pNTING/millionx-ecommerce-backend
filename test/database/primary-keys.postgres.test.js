const assert = require('node:assert/strict');
const { test } = require('node:test');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const { randomUUID } = require('node:crypto');
const { Client } = require('pg');
const { sqlForMode } = require('../../scripts/migrate-primary-keys');

const tables = [
  'categories',
  'products',
  'product_variants',
  'product_prices',
  'product_images',
  'customers',
  'customer_accounts',
  'customer_social_accounts',
  'addresses',
  'users',
  'zones',
];
const sql = (file) => readFileSync(join(__dirname, '../../database', file), 'utf8');
const up = sql('migrations/20261025_primary_keys_to_underscore_id.sql');
const down = sql('rollback/20261025_primary_keys_to_id.sql');

async function snapshot(client) {
  const result = {};
  for (const table of tables) {
    result[table] = (
      await client.query(`
      SELECT count(*)::int count,md5(coalesce(string_agg(data::text,'' ORDER BY data->>'_id'),'')) hash
      FROM (SELECT (to_jsonb(t)-'id'-'_id') || jsonb_build_object('_id',
        coalesce(to_jsonb(t)->'_id',to_jsonb(t)->'id')) data FROM ecommerce.${table} t) rows
    `)
    ).rows[0];
  }
  return result;
}

test(
  'physical PK migration, fresh install and rollback on a disposable PostgreSQL only',
  { timeout: 30000 },
  async (t) => {
    const port = Number(process.env.PK_MIGRATION_TEST_PORT || 15437);
    assert.ok(
      ![5432, 5436].includes(port),
      'Never run migration fixture tests on application PostgreSQL',
    );
    const client = new Client({
      host: '127.0.0.1',
      port,
      database: 'millionx_ecommerce',
      user: 'postgres',
      password: 'millionx-local-migration-test-only',
      connectionTimeoutMillis: 5000,
    });
    await client.connect();
    try {
      assert.equal(
        (
          await client.query(
            "SELECT count(*)::int n FROM information_schema.tables WHERE table_schema='ecommerce'",
          )
        ).rows[0].n,
        0,
        'Disposable fixture database must be empty; no existing schema may be replaced',
      );
      for (const file of [
        'init/00_auth_zone.sql',
        'init/01_ecommerce_foundation.sql',
        'init/02_customer_social_accounts.sql',
        'seeds/01_foundation_seed.sql',
      ])
        await client.query(sql(file));
      // Exercise every renamed table, including a provider account and a hashed credential record.
      const customer = (await client.query('SELECT _id FROM ecommerce.customers LIMIT 1')).rows[0]
        ._id;
      await client.query(
        'INSERT INTO ecommerce.customer_accounts ("customerId","passwordHash") VALUES ($1,$2) ON CONFLICT ("customerId") DO NOTHING',
        [customer, 'fixture-hash-preserved-byte-for-byte'],
      );
      await client.query(
        'INSERT INTO ecommerce.customer_social_accounts ("customerId",provider,"providerId") VALUES ($1,$2,$3)',
        [customer, 'GOOGLE', 'fixture-provider'],
      );
      const baseline = await snapshot(client);
      await t.test('fresh installation uses _id on all 11 tables', async () => {
        const columns = (
          await client.query(
            "SELECT column_name FROM information_schema.columns WHERE table_schema='ecommerce' AND column_name IN ('id','_id')",
          )
        ).rows;
        assert.equal(columns.length, 11);
        assert.ok(columns.every((c) => c.column_name === '_id'));
      });
      await t.test(
        'down migration restores nine legacy columns and keeps Staff/Zone unchanged',
        async () => {
          await client.query(down);
          assert.deepEqual(await snapshot(client), baseline);
          assert.equal(
            (
              await client.query(
                "SELECT count(*)::int n FROM information_schema.columns WHERE table_schema='ecommerce' AND column_name='id'",
              )
            ).rows[0].n,
            9,
          );
        },
      );
      await t.test('forward dry-run rolls back every DDL/data change', async () => {
        await client.query(sqlForMode(up, false));
        assert.equal(
          (
            await client.query(
              "SELECT count(*)::int n FROM information_schema.columns WHERE table_schema='ecommerce' AND column_name='id'",
            )
          ).rows[0].n,
          9,
        );
        assert.deepEqual(await snapshot(client), baseline);
      });
      await t.test('forward migration preserves every row, FK and index', async () => {
        await client.query(up);
        assert.deepEqual(await snapshot(client), baseline);
        assert.equal(
          (
            await client.query(
              "SELECT count(*)::int n FROM information_schema.columns WHERE table_schema='ecommerce' AND column_name='id'",
            )
          ).rows[0].n,
          0,
        );
        assert.equal(
          (
            await client.query(
              "SELECT count(*)::int n FROM pg_constraint WHERE connamespace='ecommerce'::regnamespace AND contype='f' AND convalidated",
            )
          ).rows[0].n,
          9,
        );
      });
      await t.test('forward migration is idempotent', async () => {
        await client.query(up);
        assert.deepEqual(await snapshot(client), baseline);
      });
      await t.test('database trigger still rejects a category cycle using NEW._id', async () => {
        await client.query('BEGIN');
        try {
          const root = randomUUID(),
            child = randomUUID();
          await client.query('INSERT INTO ecommerce.categories (_id,name,slug) VALUES ($1,$2,$2)', [
            root,
            'fixture-root',
          ]);
          await client.query(
            'INSERT INTO ecommerce.categories (_id,"parentId",name,slug) VALUES ($1,$2,$3,$3)',
            [child, root, 'fixture-child'],
          );
          await assert.rejects(
            client.query('UPDATE ecommerce.categories SET "parentId"=$1 WHERE _id=$2', [
              child,
              root,
            ]),
            /cannot contain a cycle/,
          );
        } finally {
          await client.query('ROLLBACK');
        }
        assert.deepEqual(await snapshot(client), baseline);
      });
      await t.test('FK enforcement and catalog view survive the rename', async () => {
        await assert.rejects(
          client.query(
            'INSERT INTO ecommerce.products ("categoryId",name,slug) VALUES ($1,$2,$2)',
            [randomUUID(), 'fixture-orphan'],
          ),
          (error) => error.code === '23503',
        );
        assert.ok(
          (await client.query('SELECT count(*)::int n FROM ecommerce.catalog_browser')).rows[0].n >
            0,
        );
      });
    } finally {
      await client.query('ROLLBACK').catch(() => {});
      await client.end();
    }
  },
);
