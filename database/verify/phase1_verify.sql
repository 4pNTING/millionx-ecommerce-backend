/*
 * MillionX E-commerce — Phase 1 verification gate
 * Read-only for application data. Temporary verification state is rolled back at the end.
 * The script raises an exception when any required check fails.
 */
BEGIN;
SET LOCAL search_path TO ecommerce, public;

CREATE TEMP TABLE phase1_verification (
  check_name text PRIMARY KEY,
  passed boolean NOT NULL,
  actual text NOT NULL,
  expected text NOT NULL,
  details text
) ON COMMIT DROP;

INSERT INTO phase1_verification
SELECT
  'Database name',
  current_database() = 'millionx_ecommerce',
  current_database(),
  'millionx_ecommerce',
  'Backend and Navicat must point to the same database';

INSERT INTO phase1_verification
SELECT
  'PostgreSQL version',
  current_setting('server_version_num')::integer >= 150000,
  current_setting('server_version'),
  '>= 15',
  'Phase 1 SQL targets PostgreSQL 15 or newer';

INSERT INTO phase1_verification
SELECT
  'pgcrypto extension',
  EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pgcrypto'),
  CASE WHEN EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pgcrypto') THEN 'installed' ELSE 'missing' END,
  'installed',
  'Required for gen_random_uuid()';

WITH expected(table_name) AS (
  VALUES
    ('users'),
    ('zones'),
    ('categories'),
    ('products'),
    ('product_variants'),
    ('product_prices'),
    ('product_images'),
    ('customers'),
    ('customer_accounts'),
    ('addresses')
), missing AS (
  SELECT e.table_name
  FROM expected e
  LEFT JOIN information_schema.tables t
    ON t.table_schema = 'ecommerce'
   AND t.table_name = e.table_name
   AND t.table_type = 'BASE TABLE'
  WHERE t.table_name IS NULL
)
INSERT INTO phase1_verification
SELECT
  'Required tables',
  count(*) = 0,
  COALESCE(string_agg(table_name, ', ' ORDER BY table_name), 'all present'),
  '10 required tables present',
  'Missing table names are shown in actual'
FROM missing;

INSERT INTO phase1_verification
SELECT
  'Phase 1 table count',
  count(*) = 10,
  count(*)::text,
  '10',
  'The ecommerce schema must contain exactly the Phase 1 tables before Phase 2 starts'
FROM information_schema.tables
WHERE table_schema = 'ecommerce'
  AND table_type = 'BASE TABLE';

INSERT INTO phase1_verification
SELECT
  'No legacy public auth tables',
  to_regclass('public.users') IS NULL AND to_regclass('public.zones') IS NULL,
  COALESCE(NULLIF(concat_ws(', ',
    CASE WHEN to_regclass('public.users') IS NOT NULL THEN 'public.users' END,
    CASE WHEN to_regclass('public.zones') IS NOT NULL THEN 'public.zones' END
  ), ''), 'none'),
  'none',
  'Staff/Auth and Zone tables belong in ecommerce, not public';

INSERT INTO phase1_verification
SELECT
  'Catalog browser view',
  to_regclass('ecommerce.catalog_browser') IS NOT NULL,
  CASE
    WHEN to_regclass('ecommerce.catalog_browser') IS NOT NULL THEN 'ecommerce.catalog_browser'
    ELSE 'missing'
  END,
  'ecommerce.catalog_browser',
  'Public catalog read view';

WITH expected(table_name, column_name) AS (
  VALUES
    ('users', '_id'),
    ('zones', '_id'),
    ('categories', 'id'),
    ('products', 'id'),
    ('product_variants', 'id'),
    ('product_prices', 'id'),
    ('product_images', 'id'),
    ('customers', 'id'),
    ('customer_accounts', 'id'),
    ('addresses', 'id')
), invalid AS (
  SELECT e.table_name || '.' || e.column_name AS column_name
  FROM expected e
  LEFT JOIN information_schema.columns c
    ON c.table_schema = 'ecommerce'
   AND c.table_name = e.table_name
   AND c.column_name = e.column_name
   AND c.data_type = 'uuid'
  WHERE c.column_name IS NULL
)
INSERT INTO phase1_verification
SELECT
  'UUID primary-key column types',
  count(*) = 0,
  COALESCE(string_agg(column_name, ', ' ORDER BY column_name), 'all UUID'),
  '10 UUID columns',
  'Invalid or missing columns are shown in actual'
FROM invalid;

WITH phase1_ids AS (
  SELECT 'users' AS table_name, _id AS id FROM ecommerce.users
  UNION ALL SELECT 'zones', _id FROM ecommerce.zones
  UNION ALL SELECT 'categories', id FROM ecommerce.categories
  UNION ALL SELECT 'products', id FROM ecommerce.products
  UNION ALL SELECT 'product_variants', id FROM ecommerce.product_variants
  UNION ALL SELECT 'product_prices', id FROM ecommerce.product_prices
  UNION ALL SELECT 'product_images', id FROM ecommerce.product_images
  UNION ALL SELECT 'customers', id FROM ecommerce.customers
  UNION ALL SELECT 'customer_accounts', id FROM ecommerce.customer_accounts
  UNION ALL SELECT 'addresses', id FROM ecommerce.addresses
), invalid AS (
  SELECT table_name, count(*) AS invalid_count
  FROM phase1_ids
  WHERE id::text !~* '^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
  GROUP BY table_name
)
INSERT INTO phase1_verification
SELECT
  'Stored UUID v4 values',
  COALESCE(sum(invalid_count), 0) = 0,
  COALESCE(sum(invalid_count), 0)::text,
  '0 invalid UUIDs',
  COALESCE(string_agg(table_name || '=' || invalid_count, ', ' ORDER BY table_name), 'all valid')
FROM invalid;

WITH expected(table_name) AS (
  VALUES
    ('users'),
    ('zones'),
    ('categories'),
    ('products'),
    ('product_variants'),
    ('product_prices'),
    ('product_images'),
    ('customers'),
    ('customer_accounts'),
    ('addresses')
), missing AS (
  SELECT e.table_name
  FROM expected e
  WHERE NOT EXISTS (
    SELECT 1
    FROM pg_constraint c
    WHERE c.contype = 'p'
      AND c.conrelid = ('ecommerce.' || e.table_name)::regclass
  )
)
INSERT INTO phase1_verification
SELECT
  'Primary keys',
  count(*) = 0,
  COALESCE(string_agg(table_name, ', ' ORDER BY table_name), 'all present'),
  '10 primary keys',
  'Tables without a primary key are shown in actual'
FROM missing;

WITH expected(child_table, parent_table) AS (
  VALUES
    ('categories', 'categories'),
    ('products', 'categories'),
    ('product_variants', 'products'),
    ('product_prices', 'product_variants'),
    ('product_images', 'products'),
    ('product_images', 'product_variants'),
    ('customer_accounts', 'customers'),
    ('addresses', 'customers')
), actual AS (
  SELECT
    child.relname AS child_table,
    parent.relname AS parent_table
  FROM pg_constraint c
  JOIN pg_class child ON child.oid = c.conrelid
  JOIN pg_class parent ON parent.oid = c.confrelid
  JOIN pg_namespace n ON n.oid = child.relnamespace
  WHERE c.contype = 'f'
    AND n.nspname = 'ecommerce'
), missing AS (
  SELECT e.child_table || ' -> ' || e.parent_table AS relationship
  FROM expected e
  WHERE NOT EXISTS (
    SELECT 1
    FROM actual a
    WHERE a.child_table = e.child_table
      AND a.parent_table = e.parent_table
  )
)
INSERT INTO phase1_verification
SELECT
  'Foreign-key relationships',
  count(*) = 0,
  COALESCE(string_agg(relationship, ', ' ORDER BY relationship), 'all present'),
  '8 required relationships',
  'Missing relationships are shown in actual'
FROM missing;

WITH expected(index_name) AS (
  VALUES
    ('idx_users_active'),
    ('idx_zones_active'),
    ('idx_categories_parent_sort'),
    ('idx_products_category_active'),
    ('idx_variants_product_active'),
    ('idx_prices_lookup'),
    ('idx_images_product_sort'),
    ('idx_images_variant'),
    ('idx_addresses_customer'),
    ('idx_customer_accounts_active'),
    ('uq_product_variants_barcode'),
    ('uq_open_variant_price'),
    ('uq_customers_email_ci'),
    ('uq_customers_phone'),
    ('uq_customer_default_address')
), missing AS (
  SELECT e.index_name
  FROM expected e
  LEFT JOIN pg_indexes i
    ON i.schemaname = 'ecommerce'
   AND i.indexname = e.index_name
  WHERE i.indexname IS NULL
)
INSERT INTO phase1_verification
SELECT
  'Required indexes',
  count(*) = 0,
  COALESCE(string_agg(index_name, ', ' ORDER BY index_name), 'all present'),
  '15 required indexes',
  'Missing indexes are shown in actual'
FROM missing;

INSERT INTO phase1_verification
SELECT
  'Category cycle trigger',
  EXISTS (
    SELECT 1
    FROM pg_trigger
    WHERE tgrelid = 'ecommerce.categories'::regclass
      AND tgname = 'trg_prevent_category_cycle'
      AND tgenabled <> 'D'
      AND NOT tgisinternal
  ),
  CASE WHEN EXISTS (
    SELECT 1
    FROM pg_trigger
    WHERE tgrelid = 'ecommerce.categories'::regclass
      AND tgname = 'trg_prevent_category_cycle'
      AND tgenabled <> 'D'
      AND NOT tgisinternal
  ) THEN 'enabled' ELSE 'missing or disabled' END,
  'enabled',
  'Prevents parentId cycles';

WITH RECURSIVE category_walk AS (
  SELECT id, "parentId", ARRAY[id] AS path, false AS has_cycle
  FROM ecommerce.categories
  UNION ALL
  SELECT w.id, parent."parentId", w.path || parent.id, parent.id = ANY(w.path)
  FROM category_walk w
  JOIN ecommerce.categories parent ON parent.id = w."parentId"
  WHERE NOT w.has_cycle
), cycles AS (
  SELECT count(DISTINCT id) AS invalid_count
  FROM category_walk
  WHERE has_cycle
)
INSERT INTO phase1_verification
SELECT
  'Category hierarchy data',
  invalid_count = 0,
  invalid_count::text,
  '0 cycles',
  'Checks the complete stored parentId hierarchy'
FROM cycles;

WITH orphan_counts AS (
  SELECT
    (SELECT count(*) FROM ecommerce.products p LEFT JOIN ecommerce.categories c ON c.id = p."categoryId" WHERE c.id IS NULL) +
    (SELECT count(*) FROM ecommerce.product_variants v LEFT JOIN ecommerce.products p ON p.id = v."productId" WHERE p.id IS NULL) +
    (SELECT count(*) FROM ecommerce.product_prices pp LEFT JOIN ecommerce.product_variants v ON v.id = pp."variantId" WHERE v.id IS NULL) +
    (SELECT count(*) FROM ecommerce.product_images pi LEFT JOIN ecommerce.products p ON p.id = pi."productId" WHERE p.id IS NULL) +
    (SELECT count(*) FROM ecommerce.product_images pi LEFT JOIN ecommerce.product_variants v ON v.id = pi."variantId" AND v."productId" = pi."productId" WHERE pi."variantId" IS NOT NULL AND v.id IS NULL) +
    (SELECT count(*) FROM ecommerce.customer_accounts ca LEFT JOIN ecommerce.customers c ON c.id = ca."customerId" WHERE c.id IS NULL) +
    (SELECT count(*) FROM ecommerce.addresses a LEFT JOIN ecommerce.customers c ON c.id = a."customerId" WHERE c.id IS NULL)
    AS invalid_count
)
INSERT INTO phase1_verification
SELECT
  'Foreign-key data integrity',
  invalid_count = 0,
  invalid_count::text,
  '0 orphan rows',
  'Checks Product, Variant, Price, Image, Account and Address ownership'
FROM orphan_counts;

WITH invalid_data AS (
  SELECT
    (SELECT count(*) FROM ecommerce.categories WHERE "sortOrder" < 0 OR "parentId" = id) +
    (SELECT count(*) FROM ecommerce.product_variants WHERE jsonb_typeof(attributes) <> 'object') +
    (SELECT count(*) FROM ecommerce.product_prices WHERE amount < 0 OR ("compareAtAmount" IS NOT NULL AND "compareAtAmount" < amount) OR ("startsAt" IS NOT NULL AND "endsAt" IS NOT NULL AND "endsAt" <= "startsAt") OR currency <> upper(currency)) +
    (SELECT count(*) FROM ecommerce.product_images WHERE "sortOrder" < 0 OR btrim(url) = '') +
    (SELECT count(*) FROM ecommerce.customers WHERE email IS NULL AND phone IS NULL) +
    (SELECT count(*) FROM ecommerce.addresses WHERE "countryCode" <> upper("countryCode") OR latitude NOT BETWEEN -90 AND 90 OR longitude NOT BETWEEN -180 AND 180)
    AS invalid_count
)
INSERT INTO phase1_verification
SELECT
  'Business constraint data',
  invalid_count = 0,
  invalid_count::text,
  '0 invalid rows',
  'Validates hierarchy, JSONB attributes, prices, images, customer contact and addresses'
FROM invalid_data;

WITH duplicate_data AS (
  SELECT
    (SELECT count(*) FROM (SELECT slug FROM ecommerce.categories GROUP BY slug HAVING count(*) > 1) x) +
    (SELECT count(*) FROM (SELECT slug FROM ecommerce.products GROUP BY slug HAVING count(*) > 1) x) +
    (SELECT count(*) FROM (SELECT sku FROM ecommerce.product_variants GROUP BY sku HAVING count(*) > 1) x) +
    (SELECT count(*) FROM (SELECT lower(email) FROM ecommerce.customers WHERE email IS NOT NULL GROUP BY lower(email) HAVING count(*) > 1) x) +
    (SELECT count(*) FROM (SELECT phone FROM ecommerce.customers WHERE phone IS NOT NULL GROUP BY phone HAVING count(*) > 1) x) +
    (SELECT count(*) FROM (SELECT "customerId" FROM ecommerce.addresses WHERE "isDefault" GROUP BY "customerId" HAVING count(*) > 1) x) +
    (SELECT count(*) FROM (SELECT "variantId", currency FROM ecommerce.product_prices WHERE "isActive" AND "endsAt" IS NULL GROUP BY "variantId", currency HAVING count(*) > 1) x)
    AS invalid_count
)
INSERT INTO phase1_verification
SELECT
  'Business uniqueness data',
  invalid_count = 0,
  invalid_count::text,
  '0 duplicate groups',
  'Checks slugs, SKU, customer contacts, default addresses and open prices'
FROM duplicate_data;

WITH invalid_hashes AS (
  SELECT
    (SELECT count(*) FROM ecommerce.users WHERE password !~ '^\$2[aby]\$[0-9]{2}\$.{53}$') +
    (SELECT count(*) FROM ecommerce.customer_accounts WHERE "passwordHash" !~ '^\$2[aby]\$[0-9]{2}\$.{53}$')
    AS invalid_count
)
INSERT INTO phase1_verification
SELECT
  'Password hashes',
  invalid_count = 0,
  invalid_count::text,
  '0 non-bcrypt passwords',
  'Plain-text passwords must never be stored'
FROM invalid_hashes;

INSERT INTO phase1_verification
SELECT
  'Active administrator',
  count(*) > 0,
  count(*)::text,
  '>= 1',
  'At least one active Admin or Manager account is required for back office login'
FROM ecommerce.users
WHERE role::text IN ('admin', 'manager')
  AND "isActive"::text = 'active'
  AND "deletedAt" IS NULL;

INSERT INTO phase1_verification
SELECT
  'Customer account linkage',
  count(*) = 0,
  count(*)::text,
  '0 customers without account',
  'Phase 1 registered customers require one customer_accounts row'
FROM ecommerce.customers c
LEFT JOIN ecommerce.customer_accounts ca ON ca."customerId" = c.id
WHERE ca.id IS NULL;

SELECT
  CASE WHEN passed THEN 'PASS' ELSE 'FAIL' END AS status,
  check_name AS "check",
  actual,
  expected,
  details
FROM phase1_verification
ORDER BY passed, check_name;

SELECT 'addresses' AS table_name, count(*) AS row_count FROM ecommerce.addresses
UNION ALL SELECT 'categories', count(*) FROM ecommerce.categories
UNION ALL SELECT 'customer_accounts', count(*) FROM ecommerce.customer_accounts
UNION ALL SELECT 'customers', count(*) FROM ecommerce.customers
UNION ALL SELECT 'product_images', count(*) FROM ecommerce.product_images
UNION ALL SELECT 'product_prices', count(*) FROM ecommerce.product_prices
UNION ALL SELECT 'product_variants', count(*) FROM ecommerce.product_variants
UNION ALL SELECT 'products', count(*) FROM ecommerce.products
UNION ALL SELECT 'users', count(*) FROM ecommerce.users
UNION ALL SELECT 'zones', count(*) FROM ecommerce.zones
ORDER BY table_name;

SELECT
  _id,
  username,
  role,
  "isActive",
  "createdAt",
  "updatedAt"
FROM ecommerce.users
ORDER BY "createdAt";

SELECT
  c.id,
  c.email,
  c.phone,
  c."isActive",
  ca.id AS "accountId",
  ca."isActive" AS "accountIsActive",
  ca."lastLoginAt",
  count(a.id)::integer AS "addressCount"
FROM ecommerce.customers c
LEFT JOIN ecommerce.customer_accounts ca ON ca."customerId" = c.id
LEFT JOIN ecommerce.addresses a ON a."customerId" = c.id
GROUP BY c.id, ca.id
ORDER BY c."createdAt";

SELECT *
FROM ecommerce.catalog_browser
ORDER BY "productName", "variantName", currency
LIMIT 50;

DO $$
DECLARE
  failed_checks text;
BEGIN
  SELECT string_agg(check_name, ', ' ORDER BY check_name)
  INTO failed_checks
  FROM phase1_verification
  WHERE NOT passed;

  IF failed_checks IS NOT NULL THEN
    RAISE EXCEPTION 'Phase 1 verification failed: %', failed_checks;
  END IF;
END $$;

ROLLBACK;
