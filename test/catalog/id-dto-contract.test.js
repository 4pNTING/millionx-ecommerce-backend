const assert = require('node:assert/strict');
const { before, test } = require('node:test');
const { readFileSync, readdirSync } = require('node:fs');
const { join } = require('node:path');
const { DataSource } = require('typeorm');
const { buildSchema, parse, validate } = require('graphql');
const { plainToInstance } = require('class-transformer');
const { validateSync } = require('class-validator');
const { activeStatusValue } = require('../../src/infrastructure/common/active-status.filter');
const { LoadCategoryDto } = require('../../src/infrastructure/resolvers/category/category.model');
const { LoadProductDto } = require('../../src/infrastructure/resolvers/product/product.model');
const { LoadCustomerDto } = require('../../src/infrastructure/resolvers/customer/customer.model');
const {
  LoadCatalogCategoriesAction,
} = require('../../src/infrastructure/repositories/category/loadCategories/loadCategories.action');
const {
  LoadCatalogProductsAction,
} = require('../../src/infrastructure/repositories/product/loadProducts/loadProducts.action');
const {
  LoadCustomersAction,
} = require('../../src/infrastructure/repositories/customer/loadCustomers/loadCustomers.action');

const schema = buildSchema(readFileSync('src/schema.gql', 'utf8'));
let source;
before(async () => {
  const entities = readdirSync('src/infrastructure/entities')
    .filter((file) => file.endsWith('.entity.ts'))
    .flatMap((file) =>
      Object.values(require(join(process.cwd(), 'src/infrastructure/entities', file))),
    );
  source = new DataSource({ type: 'postgres', entities });
  await source.buildMetadatas();
});

test('every entity has _id and maps it to the existing physical primary column', () => {
  assert.equal(source.entityMetadatas.length, 11);
  for (const metadata of source.entityMetadatas) {
    assert.equal(metadata.primaryColumns.length, 1);
    const primary = metadata.primaryColumns[0];
    assert.equal(primary.propertyName, '_id', metadata.name);
    assert.equal(primary.databaseName, '_id');
    assert.equal(primary.type, 'uuid');
  }
});

test('GraphQL exposes only _id, Dto inputs and input list arguments', () => {
  for (const name of [
    'Category',
    'Product',
    'ProductVariant',
    'ProductPrice',
    'ProductImage',
    'CustomerProfile',
    'CustomerListItem',
    'CustomerAddress',
    'LoginPayload',
    'Zone',
  ]) {
    const fields = schema.getType(name).getFields();
    assert.ok(fields._id, name);
    assert.equal(fields.id, undefined, name);
  }
  for (const [operation, dto] of [
    ['categories', 'LoadCategoryDto'],
    ['products', 'LoadProductDto'],
    ['customers', 'LoadCustomerDto'],
  ]) {
    const field = schema.getQueryType().getFields()[operation];
    assert.deepEqual(
      field.args.map((arg) => arg.name),
      ['input'],
    );
    assert.equal(field.args[0].type.toString(), dto);
    const fields = schema.getType(dto).getFields();
    assert.equal(fields.isActive.type.toString(), 'ActiveStatus');
    assert.equal(fields.includeInactive, undefined);
    assert.equal(fields.page.defaultValue, 1);
    assert.equal(fields.limit.defaultValue, 20);
  }
  assert.ok(
    schema
      .getQueryType()
      .getFields()
      .product.args.some((arg) => arg.name === '_id'),
  );
  for (const name of [
    'UpdateProductDto',
    'UpdateProductVariantDto',
    'UpdateProductPriceDto',
    'UpdateProductBundleImageDto',
    'UpdateCategoryDto',
    'UpdateCustomerAddressDto',
  ]) {
    assert.ok(schema.getType(name).getFields()._id, name);
  }
});

test('inherited DTO validation rejects invalid pages, status, limits and keyword', () => {
  for (const dto of [LoadCategoryDto, LoadProductDto, LoadCustomerDto]) {
    for (const input of [
      { page: 0 },
      { page: 1.5 },
      { limit: 0 },
      { limit: 101 },
      { isActive: true },
      { isActive: 'wrong' },
      { keyword: 'x'.repeat(321) },
    ]) {
      assert.ok(
        validateSync(plainToInstance(dto, input)).length > 0,
        `${dto.name}: ${JSON.stringify(input)}`,
      );
    }
    for (const isActive of ['active', 'inactive', 'all']) {
      assert.deepEqual(validateSync(plainToInstance(dto, { page: 1, limit: 20, isActive })), []);
    }
  }
  assert.equal(activeStatusValue('active'), true);
  assert.equal(activeStatusValue('inactive'), false);
  assert.equal(activeStatusValue('all'), undefined);
  assert.equal(activeStatusValue(undefined), true);
  assert.throws(() => activeStatusValue(true), /active, inactive, or all/);
});

test('category, product and customer actions translate status to Boolean SQL predicates', async () => {
  const { CategoryEntity } = require('../../src/infrastructure/entities/category.entity');
  const { ProductEntity } = require('../../src/infrastructure/entities/product.entity');
  const { CustomerEntity } = require('../../src/infrastructure/entities/customer.entity');
  for (const [entity, Action] of [
    [CategoryEntity, LoadCatalogCategoriesAction],
    [ProductEntity, LoadCatalogProductsAction],
    [CustomerEntity, LoadCustomersAction],
  ]) {
    for (const [status, value] of [
      ['active', true],
      ['inactive', false],
      ['all', undefined],
    ]) {
      let builder;
      const actual = source.getRepository(entity);
      const repository = {
        manager: source.manager,
        createQueryBuilder: (alias) => {
          builder = actual.createQueryBuilder(alias);
          builder.getManyAndCount = async () => [[], 0];
          builder.getCount = async () => 0;
          builder.clone = () => builder;
          builder.getRawAndEntities = async () => ({ entities: [], raw: [] });
          return builder;
        },
      };
      await new Action(repository, { hydrateProducts: async (rows) => rows }).execute({
        isActive: status,
      });
      assert.equal(builder.getParameters().isActive, value, `${entity.name}/${status}`);
      assert.equal(builder.getQuery().includes(' = :isActive'), value !== undefined);
    }
  }
});

test('all Bruno GraphQL requests validate against the current generated schema', () => {
  let checked = 0;
  for (const file of readdirSync('api-client/bruno').filter((name) => name.endsWith('.bru'))) {
    const text = readFileSync(join('api-client/bruno', file), 'utf8');
    const marker = 'body:json {';
    const start = text.indexOf(marker) + marker.length;
    const end = text.indexOf('\n}\n', start);
    const body = JSON.parse(text.slice(start, end).trim());
    if (!body.query) continue;
    assert.deepEqual(
      validate(schema, parse(body.query)).map((error) => error.message),
      [],
      file,
    );
    checked++;
  }
  assert.ok(checked >= 27);
});
