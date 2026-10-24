# Physical PostgreSQL primary columns: `id` → `_id` (2026-10-25)

The nine catalog/customer tables now use `_id` as the **actual SQL primary-key column**:
`categories`, `products`, `product_variants`, `product_prices`, `product_images`, `customers`,
`customer_accounts`, `customer_social_accounts`, and `addresses`.
`users` and `zones` already used `_id` and are left unchanged.

Foreign-reference names such as `parentId`, `categoryId`, `productId`, `variantId` and
`customerId` remain unchanged. Their FK references follow the renamed primary columns.
UUID values, credentials, row contents and timestamps must not change.

## Existing database

Use the `.env` for the intended `millionx_ecommerce` database. The live backend uses native
PostgreSQL on port **5432**, not the separate Docker PostgreSQL on port 5436.
Stop incompatible old backend processes during the apply/redeploy window.

```sh
npm run db:migrate:primary-keys -- --dry-run
PG_DUMP_BIN=/Library/PostgreSQL/18/bin/pg_dump npm run db:migrate:primary-keys -- --apply
```

Default mode runs the complete migration and validation, then **rolls back**; it commits nothing.
Dry-run briefly takes the same exclusive table locks, so choose a quiet local maintenance window.
`--apply` first creates a PostgreSQL custom-format backup and validates its archive listing with
the matching `pg_restore`. Set `PG_DUMP_BIN` to a compatible absolute path on other machines.
The backup directory `.database-backups/` is private and excluded from Git and Docker build context.
Backups contain sensitive database records; do not publish them.

The migration is transactional, bounded by a 5-second lock timeout and a 30-second statement
timeout. It validates UUID PK shape, then records canonical full-row hashes for all 11 tables.
After renaming, it asserts unchanged row counts and values, FK/constraint identities and index
identities/expressions, and checks that `catalog_browser` still executes. Any failed assertion
rolls back all schema changes. Re-running a completed forward migration is safe.

The category cycle trigger is replaced explicitly to use `NEW._id` and qualified table names;
its recursive query uses `UNION` to terminate safely even for legacy cycles.
No reset, seed, UUID normalization, DROP TABLE, FK recreation or credential reset is performed.

## Current SQL versus historical migrations

- `database/init/`: fresh installations create all 11 tables using `_id`.
- `database/seeds/`, `database/verify/`, `database/maintenance/`: use current `_id` columns.
- `src/seed.ts` and the sample-product top-up script use current column names, but were **not**
  run in apply/seed mode during this migration.
- Older dated migrations remain unchanged as historical operations. Do not rerun the old
  UUID-normalization migration on a current database. Use the new forward migration for existing data.
- Customer-auth maintenance now reads `database/maintenance/ensure_customer_accounts.sql`,
  rather than replaying a historical migration against the new schema.

## Navicat

Refresh the Tables tree / reconnect after migration, then use:

```sql
SELECT _id, name, "parentId" FROM ecommerce.categories;
SELECT _id, name, "categoryId" FROM ecommerce.products;
SELECT _id, username, role, "isActive" FROM ecommerce.users;
```

Old saved queries selecting SQL `id` must be updated. There is no new UUID to copy into clients.
The GraphQL `_id`/DTO contract from the previous change stays the same; see `ID_DTO_MIGRATION.md`.
The newly deployed Docker backend also includes that previously pending API contract change.
Frontend clients that still use GraphQL `id`, `filter`, `...Input`, or Boolean list-status values
must migrate; frontend source is outside this backend task and is not modified here.

## Rollback

The inverse SQL is `database/rollback/20261025_primary_keys_to_id.sql`.
Stop the new backend first, run that transactional file on the same database, and restore the
matching old backend image/source before serving requests. The inverse preserves Staff/Zone `_id`.
Restoring a full dump is disaster recovery, not the ordinary rename rollback; never restore
over new user writes without an explicit recovery decision and a fresh backup.

## Tests

```sh
npm run test:contract
npm run test:catalog
npm run test:catalog:postgres
npm run test:pk-migration
```

The last command requires a **disposable, initially empty** PostgreSQL instance on port 15437:

```sh
docker run -d --rm --name millionx-pk-migration-test-20261025 \
  -e POSTGRES_DB=millionx_ecommerce -e POSTGRES_PASSWORD=millionx-local-migration-test-only \
  -p 127.0.0.1:15437:5432 postgres:15-alpine
```

It refuses ports 5432/5436, uses test-only credentials, and refuses an existing application schema.
The suite covers fresh install, down migration, forward dry-run, forward apply, idempotence,
full-row preservation, FK enforcement, the cycle trigger and the catalog view.
Remove only this test container after use; do not remove application containers or volumes.

References: [PostgreSQL ALTER TABLE](https://www.postgresql.org/docs/current/sql-altertable.html),
[PL/pgSQL implementation](https://www.postgresql.org/docs/current/plpgsql-implementation.html).

## Applied result — 2026-10-25 (Asia/Vientiane)

- Applied successfully to the real `millionx_ecommerce` database on native PostgreSQL 5432.
- All 11 physical primary columns are `_id`; the nine legacy `id` columns no longer exist.
- Full-row canonical hashes and counts before/after matched in all 11 tables, including after
  integration-test cleanup. Existing UUIDs, timestamps and credential hashes did not change.
- Preserved: 420 products, 21 categories, 425 variants, 429 price records, 8 images,
  20 customers, 20 customer accounts, 15 social-account links, 5 addresses, 2 users and 4 zones.
- Backup: `.database-backups/millionx-before-pk-rename-2026-10-24T19-54-32-428Z.dump`.
  The filename uses UTC; this was 2026-10-25 locally. The archive was checked using `pg_restore --list`.
- Rebuilt/recreated only the backend Docker service; port 3001 is now running the new `_id`/DTO
  backend. PostgreSQL and production Redis were not restarted. Only catalog cache was invalidated.
- Public API verified all 21 categories have 20 direct products each; Admin Login passed on 3001.
- Build passed. Migration tests 8/8, contract/sample-data tests 10/10, catalog unit tests 9/9,
  PostgreSQL catalog regression 11/11, and integration scenarios 6/6 passed.
- The separate Docker PostgreSQL database on 5436 was not migrated; it is not serving this backend.

### Pre-existing data warning (not repaired)

The full Phase 1 verification gate has **19 passing checks and 1 failing check**:
`Stored UUID v4 values` finds 4 pre-existing non-v4 identifiers, 2 in `customers` and
2 in `customer_accounts`. PostgreSQL accepts them as UUID values, but they fail the application's
stricter v4 policy. They were preserved deliberately; this task changes column names, not IDs.
The gate has not been weakened, and the historical UUID-normalization script was not run.
Normalizing those records requires a separate, explicit data-change decision.

The Docker dependency audit also reports existing package vulnerabilities/deprecations; framework
and dependency upgrades were outside this migration. Passing migration tests does not certify
production security readiness. Frontend source/UI was not changed or browser-tested.

See `SQL_PRIMARY_KEY_MIGRATION_RESULT_20261025.json` for the audit and rollback-image identity.
