# Automated Redis Outage Test

This local-only test proves that the Backend remains available when Redis stops.

## Preconditions

Start the complete local Docker stack:

```bash
docker compose --profile full up -d --build
```

For an isolated Docker PostgreSQL database:

```bash
DOCKER_DB_HOST=postgres DOCKER_DB_PORT=5432 docker compose --profile full up -d --build
```

The database must contain at least one Category and one Product.

## Run

```bash
npm run test:redis-fallback
```

## Test sequence

1. Confirm that PostgreSQL, Redis and Backend containers are running.
2. Clear only `catalog:*` and `auth:rate-limit:*` Redis keys.
3. Read Category/Product and confirm that Backend creates catalog cache keys.
4. Stop the Redis container.
5. Confirm that Category/Product still return the same PostgreSQL data.
6. Confirm that Staff Login Rate Limit uses the in-memory fallback and returns `429`.
7. Start Redis and restart Backend because the Redis client stops reconnecting after its retry limit.
8. Confirm that the catalog remains unchanged and Redis caching works again.

The test refuses to run with `NODE_ENV=production` or a non-local API URL. It does not create,
update or delete application database rows. Its recovery step runs even when an outage assertion
fails.
