const assert = require('node:assert/strict');
const { after, before, test } = require('node:test');
const { Client } = require('pg');
const Redis = require('ioredis');

const apiBaseUrl = process.env.TEST_API_URL || `http://localhost:${process.env.PORT || 3001}`;
const graphqlUrl = `${apiBaseUrl.replace(/\/$/, '')}/api-gateway`;
const runId = `${Date.now()}-${Math.random().toString(16).slice(2, 10)}`;
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const state = {
  categoryIds: [],
  productIds: [],
  customerIds: [],
  staffToken: '',
  staffRefreshToken: '',
  customerToken: '',
  customerRefreshToken: '',
};

const customerEmail = `integration-${runId}@example.com`;
const customerPassword = 'Integration-Customer-2026!';

let redis;

function assertSafeEnvironment() {
  const url = new URL(apiBaseUrl);
  const localHosts = new Set(['localhost', '127.0.0.1', '::1']);

  if (process.env.NODE_ENV === 'production') {
    throw new Error('Integration tests are disabled when NODE_ENV=production');
  }

  if (!localHosts.has(url.hostname) && process.env.ALLOW_REMOTE_INTEGRATION_TEST !== 'true') {
    throw new Error(
      'Integration tests create temporary records. Set ALLOW_REMOTE_INTEGRATION_TEST=true ' +
        'only for an isolated remote test environment.',
    );
  }
}

async function graphql(query, variables = {}, token) {
  const response = await fetch(graphqlUrl, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ query, variables }),
    signal: AbortSignal.timeout(15_000),
  });
  const body = await response.json();
  return { response, body };
}

function dataOrThrow(result, field) {
  if (result.body.errors) {
    throw new Error(
      `GraphQL ${field} failed: ${result.body.errors.map((error) => error.message).join('; ')}`,
    );
  }
  return result.body.data[field];
}

async function scanRedis(pattern) {
  let cursor = '0';
  const keys = [];
  do {
    const [nextCursor, page] = await redis.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
    cursor = nextCursor;
    keys.push(...page);
  } while (cursor !== '0');
  return keys;
}

async function clearRateLimitKeys() {
  if (!redis) return;
  const keys = await scanRedis('auth:rate-limit:*');
  if (keys.length > 0) await redis.del(...keys);
}

async function cleanupDatabase() {
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 5432),
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'millionx_ecommerce',
  });

  await client.connect();
  try {
    await client.query('BEGIN');
    if (state.productIds.length > 0) {
      await client.query('DELETE FROM ecommerce.products WHERE id = ANY($1::uuid[])', [
        state.productIds,
      ]);
    }
    if (state.customerIds.length > 0) {
      await client.query('DELETE FROM ecommerce.customers WHERE id = ANY($1::uuid[])', [
        state.customerIds,
      ]);
    }
    for (const categoryId of [...state.categoryIds].reverse()) {
      await client.query('DELETE FROM ecommerce.categories WHERE id = $1', [categoryId]);
    }
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    await client.end();
  }
}

before(async () => {
  assertSafeEnvironment();
  redis = new Redis({
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: Number(process.env.REDIS_HOST_PORT || process.env.REDIS_PORT || 6380),
    password: process.env.REDIS_PASSWORD || undefined,
    maxRetriesPerRequest: 1,
  });
  await redis.ping();
  await clearRateLimitKeys();
});

after(async () => {
  try {
    await cleanupDatabase();
  } finally {
    await clearRateLimitKeys();
    if (redis) await redis.quit();
  }
});

test('Phase 1 API is reachable', async () => {
  const result = await graphql(`
    query IntegrationReadiness {
      categories(filter: { page: 1, limit: 1 }) {
        total
        page
        limit
      }
    }
  `);

  const page = dataOrThrow(result, 'categories');
  assert.equal(result.response.status, 200);
  assert.equal(page.page, 1);
  assert.equal(page.limit, 1);
  assert.equal(typeof page.total, 'number');
});

test('Staff login, refresh rotation and refresh-token isolation work', async () => {
  const loginResult = await graphql(
    `
      mutation StaffLogin($input: LoginInput!) {
        login(input: $input) {
          _id
          username
          role
          token
          refreshToken
        }
      }
    `,
    {
      input: {
        username: process.env.SEED_ADMIN_USERNAME || 'admin',
        password: process.env.SEED_ADMIN_PASSWORD,
      },
    },
  );
  const login = dataOrThrow(loginResult, 'login');
  assert.match(login._id, uuidPattern);
  assert.equal(login.username, process.env.SEED_ADMIN_USERNAME || 'admin');
  assert.equal(typeof login.token, 'string');
  assert.equal(typeof login.refreshToken, 'string');
  assert.notEqual(login.token, login.refreshToken);
  state.staffToken = login.token;
  state.staffRefreshToken = login.refreshToken;

  const identityKeysAfterSuccess = await scanRedis('auth:rate-limit:staff-login:identity:*');
  const ipKeysAfterSuccess = await scanRedis('auth:rate-limit:staff-login:ip:*');
  assert.equal(identityKeysAfterSuccess.length, 0, 'successful login must reset account counter');
  assert.equal(ipKeysAfterSuccess.length, 1, 'successful login must retain IP counter');

  const refreshResult = await graphql(
    `
      mutation RefreshStaff($input: RefreshTokenInput!) {
        refreshStaffToken(input: $input) {
          token
          refreshToken
        }
      }
    `,
    { input: { refreshToken: state.staffRefreshToken } },
  );
  const refreshed = dataOrThrow(refreshResult, 'refreshStaffToken');
  assert.notEqual(refreshed.token, state.staffToken);
  assert.notEqual(refreshed.refreshToken, state.staffRefreshToken);
  state.staffToken = refreshed.token;
  state.staffRefreshToken = refreshed.refreshToken;

  const rejected = await graphql(
    `
      query RejectRefreshAsAccess {
        customers(filter: { page: 1, limit: 1 }) {
          total
        }
      }
    `,
    {},
    state.staffRefreshToken,
  );
  assert.ok(rejected.body.errors, 'refresh token must not authorize protected queries');
});

test('Category CRUD, filter, pagination and cycle protection work', async () => {
  const rootSlug = `integration-root-${runId}`;
  const rootResult = await graphql(
    `
      mutation CreateCategory($input: CreateCategoryInput!) {
        createCategory(input: $input) {
          id
          parentId
          name
          slug
          sortOrder
          isActive
        }
      }
    `,
    {
      input: {
        name: `Integration Root ${runId}`,
        slug: rootSlug,
        description: 'Automated integration test root category',
        sortOrder: 901,
      },
    },
    state.staffToken,
  );
  const root = dataOrThrow(rootResult, 'createCategory');
  assert.match(root.id, uuidPattern);
  assert.equal(root.parentId, null);
  state.categoryIds.push(root.id);

  const childResult = await graphql(
    `
      mutation CreateCategory($input: CreateCategoryInput!) {
        createCategory(input: $input) {
          id
          parentId
          slug
        }
      }
    `,
    {
      input: {
        parentId: root.id,
        name: `Integration Child ${runId}`,
        slug: `integration-child-${runId}`,
        sortOrder: 902,
      },
    },
    state.staffToken,
  );
  const child = dataOrThrow(childResult, 'createCategory');
  assert.equal(child.parentId, root.id);
  state.categoryIds.push(child.id);

  const listResult = await graphql(
    `
      query Categories($filter: CategoryFilterInput) {
        categories(filter: $filter) {
          items {
            id
            parentId
            slug
          }
          total
          page
          limit
        }
      }
    `,
    { filter: { keyword: runId, page: 1, limit: 1, includeInactive: true } },
  );
  const page = dataOrThrow(listResult, 'categories');
  assert.equal(page.page, 1);
  assert.equal(page.limit, 1);
  assert.ok(page.total >= 2);
  assert.equal(page.items.length, 1);

  const cycleResult = await graphql(
    `
      mutation RejectCategoryCycle($input: UpdateCategoryInput!) {
        updateCategory(input: $input) {
          id
          parentId
        }
      }
    `,
    { input: { id: root.id, parentId: child.id } },
    state.staffToken,
  );
  assert.match(cycleResult.body.errors?.[0]?.message || '', /cycle/i);
});

test('Product bundle create/update and transaction rollback work', async () => {
  const categoryId = state.categoryIds[0];
  const sku = `MX-INT-${runId}`;
  const productResult = await graphql(
    `
      mutation CreateProductBundle($input: CreateProductBundleInput!) {
        createProductBundle(input: $input) {
          id
          categoryId
          name
          slug
          brand
          variants {
            id
            sku
            name
            attributesJson
            prices {
              id
              currency
              amount
              compareAtAmount
            }
          }
          images {
            id
            url
            altText
            sortOrder
          }
        }
      }
    `,
    {
      input: {
        categoryId,
        name: `Integration Product ${runId}`,
        slug: `integration-product-${runId}`,
        description: 'Automated integration product',
        brand: 'MillionX Integration',
        variants: [
          {
            sku,
            name: 'RAM 16GB',
            attributesJson: '{"ram":"16GB","color":"black"}',
            prices: [{ currency: 'LAK', amount: 1000000, compareAtAmount: 1200000 }],
          },
        ],
        images: [
          {
            url: `https://example.com/integration/${runId}.jpg`,
            altText: 'Integration image before update',
            sortOrder: 0,
          },
        ],
      },
    },
    state.staffToken,
  );
  const product = dataOrThrow(productResult, 'createProductBundle');
  assert.match(product.id, uuidPattern);
  assert.equal(product.variants.length, 1);
  assert.equal(product.variants[0].prices.length, 1);
  assert.equal(product.images.length, 1);
  state.productIds.push(product.id);

  const variant = product.variants[0];
  const price = variant.prices[0];
  const image = product.images[0];
  const updateResult = await graphql(
    `
      mutation UpdateProduct($input: UpdateProductInput!) {
        updateProduct(input: $input) {
          id
          name
          variants {
            id
            sku
            name
            attributesJson
            prices {
              id
              amount
              compareAtAmount
            }
          }
          images {
            id
            altText
            sortOrder
          }
        }
      }
    `,
    {
      input: {
        id: product.id,
        name: `Integration Product Updated ${runId}`,
        variants: [
          {
            id: variant.id,
            sku,
            name: 'RAM 32GB',
            attributesJson: '{"ram":"32GB","color":"black"}',
            prices: [
              {
                id: price.id,
                currency: 'LAK',
                amount: 1100000,
                compareAtAmount: 1300000,
              },
            ],
          },
        ],
        images: [
          {
            id: image.id,
            altText: 'Integration image after update',
            sortOrder: 2,
          },
        ],
      },
    },
    state.staffToken,
  );
  const updated = dataOrThrow(updateResult, 'updateProduct');
  assert.equal(updated.variants[0].name, 'RAM 32GB');
  assert.match(updated.variants[0].attributesJson, /32GB/);
  assert.equal(updated.variants[0].prices[0].amount, 1100000);
  assert.equal(updated.images[0].altText, 'Integration image after update');
  assert.equal(updated.images[0].sortOrder, 2);

  const rollbackSlug = `integration-rollback-${runId}`;
  const invalidResult = await graphql(
    `
      mutation RejectInvalidProduct($input: CreateProductBundleInput!) {
        createProductBundle(input: $input) {
          id
        }
      }
    `,
    {
      input: {
        categoryId,
        name: `Integration Rollback ${runId}`,
        slug: rollbackSlug,
        variants: [
          {
            sku: `MX-ROLLBACK-${runId}`,
            prices: [{ currency: 'LAK', amount: 2000, compareAtAmount: 1000 }],
          },
        ],
      },
    },
    state.staffToken,
  );
  assert.match(invalidResult.body.errors?.[0]?.message || '', /compareAtAmount/i);

  const rollbackRead = await graphql(
    `
      query RolledBackProduct($filter: ProductFilterInput) {
        products(filter: $filter) {
          total
          items {
            id
            slug
          }
        }
      }
    `,
    { filter: { keyword: rollbackSlug, page: 1, limit: 10, includeInactive: true } },
  );
  assert.equal(dataOrThrow(rollbackRead, 'products').total, 0);
});

test('Customer register/login/profile/address and Admin customer list work', async () => {
  const registerResult = await graphql(
    `
      mutation RegisterCustomer($input: RegisterCustomerInput!) {
        registerCustomer(input: $input) {
          accountId
          customerId
          email
          token
          refreshToken
        }
      }
    `,
    {
      input: {
        firstName: 'ທົດສອບ',
        lastName: 'ອັດຕະໂນມັດ',
        email: customerEmail,
        password: customerPassword,
      },
    },
  );
  const registered = dataOrThrow(registerResult, 'registerCustomer');
  assert.match(registered.customerId, uuidPattern);
  assert.equal(registered.email, customerEmail);
  state.customerIds.push(registered.customerId);

  const loginResult = await graphql(
    `
      mutation LoginCustomer($input: CustomerLoginInput!) {
        loginCustomer(input: $input) {
          customerId
          token
          refreshToken
        }
      }
    `,
    { input: { identifier: customerEmail, password: customerPassword } },
  );
  const login = dataOrThrow(loginResult, 'loginCustomer');
  assert.equal(login.customerId, registered.customerId);
  state.customerToken = login.token;
  state.customerRefreshToken = login.refreshToken;

  const refreshResult = await graphql(
    `
      mutation RefreshCustomer($input: RefreshTokenInput!) {
        refreshCustomerToken(input: $input) {
          token
          refreshToken
          customerId
        }
      }
    `,
    { input: { refreshToken: state.customerRefreshToken } },
  );
  const refreshed = dataOrThrow(refreshResult, 'refreshCustomerToken');
  assert.equal(refreshed.customerId, registered.customerId);
  assert.notEqual(refreshed.token, state.customerToken);
  state.customerToken = refreshed.token;
  state.customerRefreshToken = refreshed.refreshToken;

  const profileResult = await graphql(
    `
      mutation UpdateProfile($input: UpdateCustomerProfileInput!) {
        updateCustomerProfile(input: $input) {
          id
          firstName
          lastName
          email
        }
      }
    `,
    { input: { firstName: 'ທົດສອບແກ້ໄຂ', lastName: 'Integration' } },
    state.customerToken,
  );
  const profile = dataOrThrow(profileResult, 'updateCustomerProfile');
  assert.equal(profile.id, registered.customerId);
  assert.equal(profile.firstName, 'ທົດສອບແກ້ໄຂ');

  const addressResult = await graphql(
    `
      mutation CreateAddress($input: CreateCustomerAddressInput!) {
        createCustomerAddress(input: $input) {
          id
          addresses {
            id
            label
            province
            countryCode
            isDefault
          }
        }
      }
    `,
    {
      input: {
        label: 'Integration Home',
        recipientName: 'MillionX Integration',
        phone: `+85620${Date.now().toString().slice(-8)}`,
        addressLine1: 'ບ້ານທົດສອບ',
        district: 'ໄຊເສດຖາ',
        province: 'ວຽງຈັນ',
        countryCode: 'LA',
        isDefault: true,
      },
    },
    state.customerToken,
  );
  const addressProfile = dataOrThrow(addressResult, 'createCustomerAddress');
  assert.equal(addressProfile.addresses.length, 1);
  assert.equal(addressProfile.addresses[0].isDefault, true);
  const addressId = addressProfile.addresses[0].id;

  const adminListResult = await graphql(
    `
      query CustomerList($filter: CustomerFilterInput) {
        customers(filter: $filter) {
          items {
            id
            email
            accountId
            addressCount
          }
          total
          page
          limit
        }
      }
    `,
    { filter: { keyword: customerEmail, page: 1, limit: 10 } },
    state.staffToken,
  );
  const customerPage = dataOrThrow(adminListResult, 'customers');
  assert.equal(customerPage.total, 1);
  assert.equal(customerPage.items[0].id, registered.customerId);
  assert.equal(customerPage.items[0].addressCount, 1);

  const deleteResult = await graphql(
    `
      mutation DeleteAddress($addressId: String!) {
        deleteCustomerAddress(addressId: $addressId)
      }
    `,
    { addressId },
    state.customerToken,
  );
  assert.equal(dataOrThrow(deleteResult, 'deleteCustomerAddress'), true);
});

test('Staff login, Customer login/register and REST return rate-limit metadata', async () => {
  await clearRateLimitKeys();

  const staffInput = {
    username: `rate-limit-${runId}`,
    password: 'wrong-password',
  };
  let staffResult;
  for (let attempt = 1; attempt <= 6; attempt += 1) {
    staffResult = await graphql(
      `
        mutation RateLimitedStaff($input: LoginInput!) {
          login(input: $input) {
            username
          }
        }
      `,
      { input: staffInput },
    );
  }
  const staffError = staffResult.body.errors?.[0];
  assert.equal(staffError?.extensions?.code, 'TOO_MANY_REQUESTS');
  assert.equal(staffError?.extensions?.statusCode, 429);
  assert.ok(staffError?.extensions?.retryAfterSeconds > 0);

  const restResponse = await fetch(`${apiBaseUrl.replace(/\/$/, '')}/api/auth/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(staffInput),
    signal: AbortSignal.timeout(15_000),
  });
  const restBody = await restResponse.json();
  assert.equal(restResponse.status, 429);
  assert.ok(Number(restResponse.headers.get('retry-after')) > 0);
  assert.equal(restBody.statusCode, 429);

  let customerResult;
  for (let attempt = 1; attempt <= 6; attempt += 1) {
    customerResult = await graphql(
      `
        mutation RateLimitedCustomer($input: CustomerLoginInput!) {
          loginCustomer(input: $input) {
            customerId
          }
        }
      `,
      {
        input: {
          identifier: `rate-limit-${runId}@example.com`,
          password: 'wrong-password',
        },
      },
    );
  }
  assert.equal(customerResult.body.errors?.[0]?.extensions?.statusCode, 429);

  let registerResult;
  for (let attempt = 1; attempt <= 4; attempt += 1) {
    registerResult = await graphql(
      `
        mutation RateLimitedRegister($input: RegisterCustomerInput!) {
          registerCustomer(input: $input) {
            customerId
          }
        }
      `,
      { input: { email: customerEmail, password: customerPassword } },
    );
  }
  assert.equal(registerResult.body.errors?.[0]?.extensions?.statusCode, 429);
});
