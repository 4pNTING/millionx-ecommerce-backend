const { test } = require('node:test');
const assert = require('node:assert/strict');
const { planTopUp, sampleFor, topUp } = require('../../scripts/top-up-category-products');

test('tops up each category ID, including duplicate names, without deleting excess products', () => {
  const plan = planTopUp([
    { _id: 'a', name: 'same', count: 0 },
    { _id: 'b', name: 'same', count: 1 },
    { _id: 'c', count: 20 },
    { _id: 'd', count: 25 },
  ]);
  assert.deepEqual(
    plan.map((c) => c.add),
    [20, 19, 0, 0],
  );
  assert.deepEqual(planTopUp([]), []);
});

test('a full catalog needs no further inserts', () => {
  assert.equal(planTopUp([{ _id: 'a', count: '20' }])[0].add, 0);
});

test('dry-run uses a read-only transaction and never inserts or locks tables', async () => {
  const queries = [];
  const client = {
    query: async (sql) => {
      queries.push(sql);
      if (sql.includes('current_database()')) return { rows: [{ name: 'millionx_ecommerce' }] };
      if (sql.includes('GROUP BY c._id')) return { rows: [{ _id: 'a', name: 'ຫູຟັງ', count: 1 }] };
      return { rows: [] };
    },
  };
  const report = await topUp(client, false);
  assert.equal(report.addedProducts, 19);
  assert.equal(report.batchId, null);
  assert.equal(queries[0], 'BEGIN READ ONLY');
  assert.equal(queries.at(-1), 'COMMIT');
  assert.ok(queries.every((sql) => !/INSERT|UPDATE|DELETE|LOCK TABLE/.test(sql)));
});

test('refuses the wrong database and rolls back without inserts', async () => {
  const queries = [];
  const client = {
    query: async (sql) => {
      queries.push(sql);
      return { rows: [{ name: 'another_database' }] };
    },
  };
  await assert.rejects(topUp(client, true), /Refusing a database/);
  assert.equal(queries.at(-1), 'ROLLBACK');
  assert.ok(queries.every((sql) => !sql.includes('INSERT')));
});

test('all sample prices and attributes respect database constraints', () => {
  for (const name of [
    'Home Appliances',
    'ແລັບທັອບ',
    'ຄອມພິວເຕີ',
    'ໂທລະສັບມືຖື',
    'ເຄື່ອງນຸ່ງຜູ້ຍິງ',
    'ເກີບ',
    'ຫູຟັງ',
  ]) {
    for (let i = 1; i <= 20; i++) {
      const sample = sampleFor({ name }, i);
      assert.ok(sample.amount > 0);
      assert.ok(sample.compareAtAmount >= sample.amount);
      assert.equal(typeof sample.attributes, 'object');
      assert.ok(sample.name.length < 200);
      assert.ok(sample.name.includes('ຕົວຢ່າງ'));
      assert.ok(!sample.description.includes('Home Appliances'));
    }
  }
});
