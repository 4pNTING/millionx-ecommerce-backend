'use strict';

// Opt-in demo data only. Never run the general seed or update existing catalog/auth rows.
const { randomUUID } = require('node:crypto');
const { isDeepStrictEqual } = require('node:util');
const { Client } = require('pg');

const TARGET = 20;
const TABLES = ['categories', 'products', 'product_variants', 'product_prices', 'product_images'];

function planTopUp(categories) {
  return categories.map((category) => ({
    ...category,
    before: Number(category.count),
    add: Math.max(0, TARGET - Number(category.count)),
  }));
}

function sampleFor(category, ordinal) {
  const name = category.name;
  const number = String(ordinal).padStart(2, '0');
  let label = name === 'Home Appliances' ? 'ເຄື່ອງໃຊ້ໄຟຟ້າໃນເຮືອນ' : name;
  let amount = 250000 + ordinal * 25000;
  let attributes = { color: ordinal % 2 ? 'ດຳ' : 'ຂາວ' };
  if (/ແລັບທັອບ|ຄອມພິວເຕີ/.test(name)) {
    amount = 6500000 + ordinal * 250000;
    attributes = { ram: ordinal % 2 ? '8GB' : '16GB', storage: '512GB', color: 'ດຳ' };
  } else if (/ໂທລະສັບ/.test(name)) {
    amount = 2000000 + ordinal * 150000;
    attributes = { storage: ordinal % 2 ? '128GB' : '256GB', color: 'ດຳ' };
  } else if (/ເຄື່ອງນຸ່ງ|ແຟຊັ່ນ/.test(name)) {
    label = /ຜູ້ຍິງ/.test(name) ? 'ເສື້ອຜູ້ຍິງ' : 'ເສື້ອຍືດ';
    amount = 80000 + ordinal * 10000;
    attributes = { size: ['S', 'M', 'L', 'XL'][ordinal % 4], color: 'ຂາວ' };
  } else if (/ເກີບ/.test(name)) {
    label = 'ເກີບກິລາ';
    amount = 200000 + ordinal * 15000;
    attributes = { size: String(38 + (ordinal % 6)), color: 'ດຳ' };
  } else if (/Appliances|ເຄື່ອງໃຊ້ໄຟຟ້າ/.test(name)) {
    label = ['ໝໍ້ຫຸງເຂົ້າ', 'ພັດລົມ', 'ກາຕົ້ມນ້ຳ', 'ເຕົາລີດ'][(ordinal - 1) % 4];
    amount = 300000 + ordinal * 50000;
  }
  return {
    name: `${label} ຕົວຢ່າງ ${number}`,
    description: `ສິນຄ້າຕົວຢ່າງສຳລັບທົດສອບ MillionX ໃນໝວດ ${name === 'Home Appliances' ? 'ເຄື່ອງໃຊ້ໄຟຟ້າໃນເຮືອນ' : name}. ບໍ່ແມ່ນສິນຄ້າຈຳໜ່າຍຈິງ.`,
    variantName: `ຮຸ່ນມາດຕະຖານ ${number}`,
    attributes,
    amount,
    compareAtAmount: amount + Math.round(amount * 0.1),
  };
}

async function snapshot(client, table, ids) {
  const where = ids ? ' WHERE _id = ANY($1::uuid[])' : '';
  return (
    await client.query(
      `SELECT _id, md5(row_to_json(t)::text) AS hash FROM ecommerce.${table} t${where} ORDER BY _id`,
      ids ? [ids] : [],
    )
  ).rows;
}

async function topUp(client, apply) {
  let transactionOpen = false;
  try {
    await client.query(apply ? 'BEGIN' : 'BEGIN READ ONLY');
    transactionOpen = true;
    const database = (await client.query('SELECT current_database() AS name')).rows[0].name;
    if (database !== 'millionx_ecommerce')
      throw new Error('Refusing a database other than millionx_ecommerce');
    if (apply) {
      await client.query("SET LOCAL lock_timeout = '5s'");
      await client.query("SET LOCAL statement_timeout = '30s'");
      // Short-lived locks keep category counts stable, including against normal API inserts.
      await client.query(
        `LOCK TABLE ${TABLES.map((t) => `ecommerce.${t}`).join(', ')} IN SHARE ROW EXCLUSIVE MODE`,
      );
    }
    const categories = (
      await client.query(`
      SELECT c._id, c.name, c."isActive", count(p._id)::int AS count
      FROM ecommerce.categories c LEFT JOIN ecommerce.products p ON p."categoryId" = c._id
      GROUP BY c._id ORDER BY c._id
    `)
    ).rows;
    const plan = planTopUp(categories);
    const batchId = apply ? randomUUID() : null;
    const report = {
      mode: apply ? 'apply' : 'dry-run',
      database,
      targetDirectProducts: TARGET,
      batchId,
      categoryCount: plan.length,
      addedProducts: plan.reduce((sum, c) => sum + c.add, 0),
      categories: plan.map((c) => ({
        _id: c._id,
        name: c.name,
        before: c.before,
        add: c.add,
        after: c.before + c.add,
      })),
    };
    if (apply) {
      const original = {};
      for (const table of TABLES) original[table] = await snapshot(client, table);
      for (const category of plan) {
        for (let offset = 1; offset <= category.add; offset++) {
          const ordinal = category.before + offset;
          const sample = sampleFor(category, ordinal);
          const productId = randomUUID();
          const variantId = randomUUID();
          await client.query(
            `
            INSERT INTO ecommerce.products (_id, "categoryId", name, slug, description, brand, "isActive")
            VALUES ($1,$2,$3,$4,$5,'MillionX Demo',true)
          `,
            [
              productId,
              category._id,
              sample.name,
              `mx-demo20-${batchId}-${category._id}-${ordinal}`,
              sample.description,
            ],
          );
          await client.query(
            `
            INSERT INTO ecommerce.product_variants (_id, "productId", sku, name, attributes, "isActive")
            VALUES ($1,$2,$3,$4,$5::jsonb,true)
          `,
            [
              variantId,
              productId,
              `MX-DEMO20-${batchId}-${category._id}-${ordinal}`,
              sample.variantName,
              JSON.stringify(sample.attributes),
            ],
          );
          await client.query(
            `
            INSERT INTO ecommerce.product_prices ("variantId", currency, amount, "compareAtAmount", "isActive")
            VALUES ($1,'LAK',$2,$3,true)
          `,
            [variantId, sample.amount, sample.compareAtAmount],
          );
        }
      }
      for (const table of TABLES) {
        const unchanged = await snapshot(
          client,
          table,
          original[table].map((row) => row._id),
        );
        if (!isDeepStrictEqual(unchanged, original[table]))
          throw new Error(`Existing rows changed in ${table}`);
      }
      const counts = (
        await client.query(`
        SELECT c._id, count(p._id)::int AS count FROM ecommerce.categories c
        LEFT JOIN ecommerce.products p ON p."categoryId" = c._id GROUP BY c._id
      `)
      ).rows;
      for (const category of plan) {
        if (counts.find((c) => c._id === category._id)?.count !== category.before + category.add) {
          throw new Error(`Unexpected final count for ${category._id}`);
        }
      }
      report.originalCatalogRowsUnchanged = true;
      report.addedVariants = report.addedProducts;
      report.addedPrices = report.addedProducts;
      report.addedImages = 0;
    }
    await client.query('COMMIT');
    transactionOpen = false;
    return report;
  } catch (error) {
    if (transactionOpen) await client.query('ROLLBACK');
    throw error;
  }
}

async function main() {
  const args = process.argv.slice(2);
  if (args.some((arg) => !['--apply', '--dry-run'].includes(arg)) || args.length > 1) {
    throw new Error(
      'Usage: node --env-file=.env scripts/top-up-category-products.js [--dry-run | --apply]',
    );
  }
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
    console.log(JSON.stringify(await topUp(client, args.includes('--apply')), null, 2));
  } finally {
    await client.end();
  }
}

module.exports = { planTopUp, sampleFor, topUp };
if (require.main === module)
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
