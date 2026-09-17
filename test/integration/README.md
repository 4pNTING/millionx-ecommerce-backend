# Phase 1 Automated Integration Test

The suite calls the running Backend through GraphQL/REST and verifies the complete Phase 1 flow.

## Run

```bash
docker compose --profile full up -d --build
npm run test:integration
```

The command reads local connection values and test credentials from `.env`.

## Covered flows

- Staff login, access/refresh token separation and refresh rotation
- Category create, hierarchy, filter, pagination and cycle protection
- Product bundle create/update, Variant, Price, Image/Alternative text and transaction rollback
- Customer register/login/refresh, Profile, Address and Admin customer list
- GraphQL and REST Rate Limit response including HTTP 429 and `Retry-After`

The test refuses to run with `NODE_ENV=production`. It generates unique records, deletes only the
UUIDs it created and clears temporary Auth Rate Limit counters before and after the test.
