const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const { test } = require('node:test');
const Redis = require('ioredis');

const apiBaseUrl = process.env.TEST_API_URL || `http://localhost:${process.env.PORT || 3001}`;
const graphqlUrl = `${apiBaseUrl.replace(/\/$/, '')}/api-gateway`;
const redisHost = process.env.TEST_REDIS_HOST || '127.0.0.1';
const redisPort = Number(
  process.env.TEST_REDIS_PORT || process.env.REDIS_HOST_PORT || process.env.REDIS_PORT || 6380,
);
const redisPassword = process.env.REDIS_PASSWORD || undefined;
const loginLimit = Number(process.env.AUTH_LOGIN_RATE_LIMIT_MAX || 5);

function assertSafeLocalEnvironment() {
  const url = new URL(apiBaseUrl);
  const localHosts = new Set(['localhost', '127.0.0.1', '::1']);

  if (process.env.NODE_ENV === 'production') {
    throw new Error('Redis outage tests are disabled when NODE_ENV=production');
  }

  if (!localHosts.has(url.hostname)) {
    throw new Error(`Redis outage tests require a local API URL; received ${apiBaseUrl}`);
  }

  if (loginLimit < 1 || loginLimit > 20) {
    throw new Error(`AUTH_LOGIN_RATE_LIMIT_MAX must be between 1 and 20; received ${loginLimit}`);
  }
}

function compose(args, options = {}) {
  try {
    return execFileSync('docker', ['compose', '--profile', 'full', ...args], {
      cwd: process.cwd(),
      encoding: 'utf8',
      stdio: options.showOutput ? 'inherit' : 'pipe',
      timeout: options.timeout || 120_000,
      env: process.env,
    });
  } catch (error) {
    const stderr = error.stderr?.toString().trim();
    throw new Error(`docker compose ${args.join(' ')} failed${stderr ? `: ${stderr}` : ''}`);
  }
}

function assertComposeServicesRunning() {
  const running = new Set(
    compose(['ps', '--status', 'running', '--services'])
      .split('\n')
      .map((service) => service.trim())
      .filter(Boolean),
  );

  const missing = ['postgres', 'redis', 'backend'].filter((service) => !running.has(service));
  if (missing.length > 0) {
    throw new Error(
      `Start the local full stack before this test. Missing services: ${missing.join(', ')}. ` +
        'Run: docker compose --profile full up -d --build',
    );
  }
}

async function graphql(query, variables = {}) {
  const response = await fetch(graphqlUrl, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ query, variables }),
    signal: AbortSignal.timeout(15_000),
  });
  const body = await response.json();
  return { response, body };
}

async function waitForApi(timeoutMs = 90_000) {
  const startedAt = Date.now();
  let lastError;

  while (Date.now() - startedAt < timeoutMs) {
    try {
      const result = await loadCatalog();
      if (!result.body.errors && result.body.data?.categories && result.body.data?.products) return;
      lastError = new Error(result.body.errors?.map((error) => error.message).join('; '));
    } catch (error) {
      lastError = error;
    }
    await new Promise((resolve) => setTimeout(resolve, 1_000));
  }

  throw new Error(`Backend did not become ready: ${lastError?.message || 'timeout'}`);
}

async function loadCatalog() {
  return graphql(`
    query RedisFallbackProbe {
      categories(filter: { page: 1, limit: 5 }) {
        total
        items {
          id
        }
      }
      products(filter: { page: 1, limit: 5 }) {
        total
        items {
          id
        }
      }
    }
  `);
}

function catalogSnapshot(result) {
  if (result.body.errors) {
    throw new Error(result.body.errors.map((error) => error.message).join('; '));
  }

  return {
    categories: {
      total: result.body.data.categories.total,
      ids: result.body.data.categories.items.map((item) => item.id),
    },
    products: {
      total: result.body.data.products.total,
      ids: result.body.data.products.items.map((item) => item.id),
    },
  };
}

function createRedisClient() {
  return new Redis({
    host: redisHost,
    port: redisPort,
    password: redisPassword,
    connectTimeout: 5_000,
    maxRetriesPerRequest: 1,
    retryStrategy: () => null,
  });
}

async function scanKeys(redis, pattern) {
  let cursor = '0';
  const keys = [];
  do {
    const [nextCursor, page] = await redis.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
    cursor = nextCursor;
    keys.push(...page);
  } while (cursor !== '0');
  return keys;
}

async function clearRedisPatterns(patterns) {
  const redis = createRedisClient();
  try {
    await redis.ping();
    for (const pattern of patterns) {
      const keys = await scanKeys(redis, pattern);
      if (keys.length > 0) await redis.del(...keys);
    }
  } finally {
    redis.disconnect();
  }
}

async function assertCatalogCacheCreated() {
  const redis = createRedisClient();
  try {
    await redis.ping();
    const keys = await scanKeys(redis, 'catalog:*');
    assert.ok(keys.some((key) => key.startsWith('catalog:categories:')));
    assert.ok(keys.some((key) => key.startsWith('catalog:products:')));
  } finally {
    redis.disconnect();
  }
}

async function assertMemoryRateLimitWorks() {
  const input = {
    username: `redis-outage-${Date.now()}`,
    password: 'intentionally-wrong-password',
  };
  let result;

  for (let attempt = 1; attempt <= loginLimit + 1; attempt += 1) {
    result = await graphql(
      `
        mutation RedisOutageRateLimit($input: LoginInput!) {
          login(input: $input) {
            username
          }
        }
      `,
      { input },
    );
  }

  const error = result.body.errors?.[0];
  assert.equal(error?.extensions?.statusCode, 429);
  assert.equal(error?.extensions?.code, 'TOO_MANY_REQUESTS');
  assert.ok(error?.extensions?.retryAfterSeconds > 0);
}

async function restoreRedisAndBackend() {
  compose(['up', '-d', '--wait', 'redis'], { showOutput: true });
  await clearRedisPatterns(['catalog:*', 'auth:rate-limit:*']);
  compose(['restart', 'backend'], { showOutput: true });
  await waitForApi();
}

test('Redis outage falls back to PostgreSQL and in-memory rate limiting', async () => {
  assertSafeLocalEnvironment();
  assertComposeServicesRunning();
  await waitForApi();
  await clearRedisPatterns(['catalog:*', 'auth:rate-limit:*']);

  const baseline = catalogSnapshot(await loadCatalog());
  assert.ok(baseline.categories.total > 0, 'Local database must contain at least one category');
  assert.ok(baseline.products.total > 0, 'Local database must contain at least one product');
  await assertCatalogCacheCreated();

  let outageError;
  try {
    compose(['stop', '-t', '5', 'redis'], { showOutput: true });
    await new Promise((resolve) => setTimeout(resolve, 1_000));

    const duringOutage = catalogSnapshot(await loadCatalog());
    assert.deepEqual(
      duringOutage,
      baseline,
      'Catalog response changed while Redis was unavailable',
    );
    await assertMemoryRateLimitWorks();
  } catch (error) {
    outageError = error;
  } finally {
    await restoreRedisAndBackend();
  }

  const afterRecovery = catalogSnapshot(await loadCatalog());
  assert.deepEqual(afterRecovery, baseline, 'Catalog response changed after Redis recovery');
  await assertCatalogCacheCreated();

  if (outageError) throw outageError;
});
