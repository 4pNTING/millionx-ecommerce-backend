const assert = require('node:assert/strict');
const { test } = require('node:test');
const { DataSource } = require('typeorm');
const { CategoryEntity } = require('../../src/infrastructure/entities/category.entity');
const { ProductEntity } = require('../../src/infrastructure/entities/product.entity');
const {
  LoadCatalogProductsAction,
} = require('../../src/infrastructure/repositories/product/loadProducts/loadProducts.action');
const {
  UpdateCatalogCategoryValidation,
} = require('../../src/infrastructure/repositories/category/updateCategory/updateCategory.validation');

test(
  'PostgreSQL subtree/count/paging/cycle regression (session-local temp tables only)',
  { timeout: 30000 },
  async (t) => {
    assert.notEqual(
      process.env.NODE_ENV,
      'production',
      'Use an isolated local development database',
    );
    const host = process.env.CATALOG_TEST_DB_HOST || process.env.DB_HOST || '127.0.0.1';
    assert.ok(
      ['localhost', '127.0.0.1', '::1'].includes(host),
      'This test only permits a local PostgreSQL host',
    );
    const source = new DataSource({
      type: 'postgres',
      host,
      port: Number(process.env.CATALOG_TEST_DB_PORT || process.env.DB_PORT || 5432),
      username: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME || 'millionx_ecommerce',
      entities: [CategoryEntity, ProductEntity],
      synchronize: false,
      extra: { connectionTimeoutMillis: 5000 },
    });
    await source.initialize();
    const session = source.createQueryRunner();
    try {
      await session.connect();
      await session.startTransaction();
      // No DDL/DML on ecommerce/public tables; pg_temp shadows names on this connection only.
      await session.query(`CREATE TEMP TABLE categories (
      _id uuid PRIMARY KEY, "parentId" uuid, name text, slug text, description text,
      "sortOrder" int DEFAULT 0, "isActive" boolean DEFAULT true,
      "createdAt" timestamp DEFAULT now(), "updatedAt" timestamp DEFAULT now()
    ) ON COMMIT DROP`);
      await session.query(`CREATE TEMP TABLE products (
      _id uuid PRIMARY KEY, "categoryId" uuid, name text, slug text, description text, brand text,
      "isActive" boolean DEFAULT true, "createdAt" timestamp DEFAULT now(), "updatedAt" timestamp DEFAULT now()
    ) ON COMMIT DROP`);
      const [resolved] =
        await session.query(`SELECT to_regclass('categories')::oid = to_regclass('pg_temp.categories')::oid AS categories,
      to_regclass('products')::oid = to_regclass('pg_temp.products')::oid AS products`);
      assert.deepEqual(resolved, { categories: true, products: true });
      await session.query(`SET LOCAL statement_timeout = '3s'`);
      const _id = (n) => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
      // root -> child -> grandchild -> great-grandchild; sibling, unrelated root, empty leaf, inactive category.
      const parents = [null, 1, 2, 3, 1, null, 1, 1];
      for (let n = 1; n <= parents.length; n++) {
        await session.query(
          'INSERT INTO pg_temp.categories(_id,"parentId",name,slug,"isActive") VALUES($1,$2,$3,$3,$4)',
          [_id(n), parents[n - 1] ? _id(parents[n - 1]) : null, `category-${n}`, n !== 8],
        );
      }
      for (const [n, category, active] of [
        [101, 1, true],
        [102, 2, true],
        [103, 3, true],
        [104, 4, true],
        [105, 5, true],
        [106, 6, true],
        [107, 2, false],
        [108, 8, true],
      ]) {
        await session.query(
          'INSERT INTO pg_temp.products(_id,"categoryId",name,slug,brand,"isActive","createdAt") VALUES($1,$2,$3,$3,$4,$5,$6)',
          [
            _id(n),
            _id(category),
            n === 104 ? 'needle-deep' : `item-${n}`,
            'MillionX',
            active,
            '2026-01-01T00:00:00Z',
          ],
        );
      }
      const products = session.manager.getRepository(ProductEntity);
      const categories = session.manager.getRepository(CategoryEntity);
      const action = new LoadCatalogProductsAction(products, {
        hydrateProducts: async (items) => items,
      });
      const list = (filter) => action.execute({ limit: 100, ...filter });
      const ids = (page) => page.items.map((item) => item._id);

      await t.test('omitted and false preserve exact-category results', async () => {
        assert.deepEqual(ids(await list({ categoryId: _id(1) })), [_id(101)]);
        assert.deepEqual(ids(await list({ categoryId: _id(1), includeDescendants: false })), [
          _id(101),
        ]);
      });
      await t.test(
        'true includes root, sibling and descendants at depth four, excluding unrelated root',
        async () => {
          const page = await list({ categoryId: _id(1), includeDescendants: true });
          assert.equal(page.total, 6);
          assert.deepEqual(ids(page), [108, 105, 104, 103, 102, 101].map(_id));
        },
      );
      await t.test('child scope never includes its parent or sibling products', async () => {
        assert.deepEqual(
          ids(await list({ categoryId: _id(2), includeDescendants: true })),
          [104, 103, 102].map(_id),
        );
      });
      await t.test(
        'leaf and nonexistent category stay empty; no all-products fallback',
        async () => {
          for (const category of [7, 999])
            assert.equal(
              (await list({ categoryId: _id(category), includeDescendants: true })).total,
              0,
            );
        },
      );
      await t.test('keyword is applied within subtree before count', async () => {
        const page = await list({
          categoryId: _id(1),
          includeDescendants: true,
          keyword: ' needle ',
        });
        assert.equal(page.total, 1);
        assert.deepEqual(ids(page), [_id(104)]);
      });
      await t.test(
        'total counts all matches, pages are stable and beyond-last page stays empty',
        async () => {
          const first = await list({
            categoryId: _id(1),
            includeDescendants: true,
            limit: 2,
            page: 1,
          });
          const second = await list({
            categoryId: _id(1),
            includeDescendants: true,
            limit: 2,
            page: 2,
          });
          const last = await list({
            categoryId: _id(1),
            includeDescendants: true,
            limit: 2,
            page: 4,
          });
          assert.equal(first.total, 6);
          assert.equal(second.total, 6);
          assert.equal(last.total, 6);
          assert.deepEqual(ids(first), [108, 105].map(_id));
          assert.deepEqual(ids(second), [104, 103].map(_id));
          assert.deepEqual(ids(last), []);
          assert.equal(last.page, 4);
        },
      );
      await t.test('no category means all products regardless of flag', async () => {
        const all = await list({});
        assert.deepEqual(ids(await list({ includeDescendants: true })), ids(all));
        assert.equal(all.total, 7);
      });
      await t.test(
        'preserves existing active policy: product status, not category status',
        async () => {
          assert.equal(
            (await list({ categoryId: _id(1), includeDescendants: true, isActive: 'all' })).total,
            7,
          );
          assert.deepEqual(ids(await list({ categoryId: _id(8), includeDescendants: true })), [
            _id(108),
          ]);
        },
      );
      await t.test('reparent beneath descendant is rejected; valid reparent allowed', async () => {
        const validator = new UpdateCatalogCategoryValidation(categories);
        await assert.rejects(
          validator.execute({ _id: _id(1), parentId: _id(4) }),
          /cannot be a descendant/,
        );
        await assert.rejects(validator.execute({ _id: _id(1), parentId: _id(1) }), /cannot equal/);
        await assert.rejects(
          validator.execute({ _id: _id(1), parentId: _id(999) }),
          /Parent category not found/,
        );
        assert.equal((await validator.execute({ _id: _id(5), parentId: _id(6) }))._id, _id(5));
      });
      await t.test('legacy cycle terminates without duplicated products', async () => {
        await session.query('UPDATE pg_temp.categories SET "parentId"=$1 WHERE _id=$2', [
          _id(4),
          _id(1),
        ]);
        const page = await list({ categoryId: _id(1), includeDescendants: true });
        assert.equal(page.total, 6);
        assert.equal(new Set(ids(page)).size, 6);
      });
    } finally {
      if (session.isTransactionActive) await session.rollbackTransaction();
      await session.release();
      await source.destroy();
    }
  },
);
