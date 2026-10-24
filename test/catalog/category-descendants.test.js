const assert = require('node:assert/strict');
const { before, test } = require('node:test');
const { readFileSync } = require('node:fs');
const { DataSource } = require('typeorm');
const { buildSchema, parse, validate } = require('graphql');
const { ProductEntity } = require('../../src/infrastructure/entities/product.entity');
const { CategoryEntity } = require('../../src/infrastructure/entities/category.entity');
const {
  LoadCatalogProductsAction,
} = require('../../src/infrastructure/repositories/product/loadProducts/loadProducts.action');
const {
  LoadCatalogProductsValidation,
} = require('../../src/infrastructure/repositories/product/loadProducts/loadProducts.validation');
const {
  DatabaseProductRepository,
} = require('../../src/infrastructure/repositories/product/product.repository');
const {
  UpdateCatalogCategoryValidation,
} = require('../../src/infrastructure/repositories/category/updateCategory/updateCategory.validation');

let source;
before(async () => {
  // Build entity metadata only: no network, schema sync, or database writes.
  source = new DataSource({ type: 'postgres', entities: [ProductEntity, CategoryEntity] });
  await source.buildMetadatas();
});

async function capture(filter) {
  let builder;
  let executions = 0;
  const products = source.getRepository(ProductEntity);
  const repository = {
    manager: source.manager,
    createQueryBuilder(alias) {
      builder = products.createQueryBuilder(alias);
      builder.getManyAndCount = async () => {
        executions++;
        return [[], 0];
      };
      return builder;
    },
  };
  const result = await new LoadCatalogProductsAction(repository, {
    hydrateProducts: async (items) => items,
  }).execute(filter);
  return {
    builder,
    result,
    executions,
    sql: builder.getQuery(),
    parameters: builder.getParameters(),
  };
}

test('omitted/false flag retains exact-category filtering, without recursion', async () => {
  for (const filter of [
    { categoryId: 'root' },
    { categoryId: 'root', includeDescendants: false },
  ]) {
    const { sql, executions } = await capture(filter);
    assert.match(sql, /"product"\."categoryId" = :categoryId/);
    assert.doesNotMatch(sql, /WITH RECURSIVE/);
    assert.equal(executions, 1);
  }
});

test('true flag uses a parameterized, cycle-safe subtree in the product query', async () => {
  const { sql, parameters, executions } = await capture({
    categoryId: 'root',
    includeDescendants: true,
  });
  assert.match(sql, /WITH RECURSIVE "category_subtree"/);
  assert.match(sql, /"product"\."categoryId" IN \(SELECT _id FROM "category_subtree"\)/);
  assert.match(sql, /"category_child"\."parentId"/);
  assert.match(sql, / UNION /);
  assert.doesNotMatch(sql, /UNION ALL/);
  assert.equal(parameters.subtreeRootId, 'root');
  assert.equal(executions, 1); // One paginated action, not per-parent HTTP/SQL lookups.
});

test('true with no category is still all products; it never starts a subtree', async () => {
  const { sql } = await capture({ includeDescendants: true });
  assert.doesNotMatch(sql, /WITH RECURSIVE/);
  assert.doesNotMatch(sql, /"product"\."categoryId"\s*(=|IN)/);
});

test('keyword, currency, active filter and paging remain intact', async () => {
  const { builder, sql, parameters, result } = await capture({
    categoryId: 'root',
    includeDescendants: true,
    keyword: ' Phone ',
    currency: 'lak',
    page: 3,
    limit: 2,
  });
  assert.match(sql, /"product"\."isActive" = :isActive/);
  assert.equal(parameters.isActive, true);
  assert.match(sql, /ILIKE :keyword/);
  assert.equal(parameters.keyword, '%Phone%');
  assert.equal(builder.expressionMap.skip, 4);
  assert.equal(builder.expressionMap.take, 2);
  assert.match(sql, /"product"\."createdAt" DESC, "product"\."_id" DESC/);
  assert.deepEqual(result, { items: [], total: 0, page: 3, limit: 2 });
});

test('non-boolean includeDescendants is rejected before database/cache access', () => {
  const validator = new LoadCatalogProductsValidation();
  assert.throws(() => validator.execute({ includeDescendants: 'true' }), /must be a boolean/);
  assert.doesNotThrow(() => validator.execute({ includeDescendants: false }));
  assert.doesNotThrow(() => validator.execute({ includeDescendants: true }));
});

test('exact and descendant results use separate normalized cache entries', async () => {
  const cache = new Map();
  let reads = 0;
  const repository = {
    manager: source.manager,
    createQueryBuilder: () => {
      const builder = source.getRepository(ProductEntity).createQueryBuilder('product');
      builder.getManyAndCount = async () => {
        reads++;
        return [[], 0];
      };
      return builder;
    },
  };
  const redis = {
    get: async (key) => cache.get(key),
    set: async (key, value) => cache.set(key, value),
  };
  const catalog = new DatabaseProductRepository(repository, null, null, null, source, redis);
  await catalog.loadProducts({ categoryId: 'root' });
  await catalog.loadProducts({ categoryId: 'root', includeDescendants: false, page: 1, limit: 20 });
  assert.equal(reads, 1);
  await catalog.loadProducts({ categoryId: 'root', includeDescendants: true });
  assert.equal(reads, 2);
  assert.equal(cache.size, 2);
  await catalog.loadProducts({ includeDescendants: true });
  await catalog.loadProducts({ includeDescendants: false });
  assert.equal(reads, 3); // Flag without category is a no-op, also for the cache key.
});

test('updated checked-in schema accepts the optional filter and keeps false default', () => {
  const schema = buildSchema(readFileSync('src/schema.gql', 'utf8'));
  const field = schema.getType('LoadProductDto').getFields().includeDescendants;
  assert.equal(field.defaultValue, false);
  assert.equal(
    validate(
      schema,
      parse(
        'query { products(input:{includeDescendants:true}) { total page limit items { _id } } }',
      ),
    ).length,
    0,
  );
});

test('reparent self is rejected before traversal', async () => {
  const repository = { findOne: async () => ({ _id: 'root' }) };
  await assert.rejects(
    new UpdateCatalogCategoryValidation(repository).execute({ _id: 'root', parentId: 'root' }),
    /cannot equal/,
  );
});

test('reparent to a descendant is rejected, other parent is allowed', async () => {
  for (const isDescendant of [true, false]) {
    const repository = {
      findOne: async ({ where }) => ({ _id: where._id }),
      createQueryBuilder: () => {
        const builder = source.getRepository(CategoryEntity).createQueryBuilder();
        builder.getRawOne = async () => (isDescendant ? { _id: 'new-parent' } : undefined);
        return builder;
      },
    };
    const promise = new UpdateCatalogCategoryValidation(repository).execute({
      _id: 'root',
      parentId: 'new-parent',
    });
    if (isDescendant) await assert.rejects(promise, /cannot be a descendant/);
    else assert.equal((await promise)._id, 'root');
  }
});
