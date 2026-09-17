/*
 * Normalize legacy Phase 1 IDs to RFC 4122 UUID v4 values.
 *
 * PostgreSQL accepts UUID-shaped values even when their version/variant bits are
 * invalid. GraphQL validation correctly rejects those values. This migration
 * replaces only invalid IDs and preserves every relationship with ON UPDATE CASCADE.
 */
BEGIN;

SET search_path TO ecommerce, public;

ALTER TABLE addresses DROP CONSTRAINT IF EXISTS "addresses_customerId_fkey";
ALTER TABLE categories DROP CONSTRAINT IF EXISTS "categories_parentId_fkey";
ALTER TABLE customer_accounts DROP CONSTRAINT IF EXISTS "customer_accounts_customerId_fkey";
ALTER TABLE product_images DROP CONSTRAINT IF EXISTS "product_images_productId_fkey";
ALTER TABLE product_images DROP CONSTRAINT IF EXISTS "product_images_variantId_productId_fkey";
ALTER TABLE product_prices DROP CONSTRAINT IF EXISTS "product_prices_variantId_fkey";
ALTER TABLE product_variants DROP CONSTRAINT IF EXISTS "product_variants_productId_fkey";
ALTER TABLE products DROP CONSTRAINT IF EXISTS "products_categoryId_fkey";

ALTER TABLE categories
  ADD CONSTRAINT "categories_parentId_fkey"
  FOREIGN KEY ("parentId") REFERENCES categories(id)
  ON UPDATE CASCADE ON DELETE RESTRICT;

ALTER TABLE products
  ADD CONSTRAINT "products_categoryId_fkey"
  FOREIGN KEY ("categoryId") REFERENCES categories(id)
  ON UPDATE CASCADE ON DELETE RESTRICT;

ALTER TABLE product_variants
  ADD CONSTRAINT "product_variants_productId_fkey"
  FOREIGN KEY ("productId") REFERENCES products(id)
  ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE product_prices
  ADD CONSTRAINT "product_prices_variantId_fkey"
  FOREIGN KEY ("variantId") REFERENCES product_variants(id)
  ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE product_images
  ADD CONSTRAINT "product_images_productId_fkey"
  FOREIGN KEY ("productId") REFERENCES products(id)
  ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE product_images
  ADD CONSTRAINT "product_images_variantId_productId_fkey"
  FOREIGN KEY ("variantId", "productId") REFERENCES product_variants(id, "productId")
  ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE customer_accounts
  ADD CONSTRAINT "customer_accounts_customerId_fkey"
  FOREIGN KEY ("customerId") REFERENCES customers(id)
  ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE addresses
  ADD CONSTRAINT "addresses_customerId_fkey"
  FOREIGN KEY ("customerId") REFERENCES customers(id)
  ON UPDATE CASCADE ON DELETE CASCADE;

UPDATE categories
SET id = gen_random_uuid()
WHERE id::text !~* '^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$';

UPDATE products
SET id = gen_random_uuid()
WHERE id::text !~* '^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$';

UPDATE product_variants
SET id = gen_random_uuid()
WHERE id::text !~* '^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$';

UPDATE product_prices
SET id = gen_random_uuid()
WHERE id::text !~* '^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$';

UPDATE product_images
SET id = gen_random_uuid()
WHERE id::text !~* '^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$';

UPDATE customers
SET id = gen_random_uuid()
WHERE id::text !~* '^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$';

UPDATE customer_accounts
SET id = gen_random_uuid()
WHERE id::text !~* '^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$';

UPDATE addresses
SET id = gen_random_uuid()
WHERE id::text !~* '^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$';

UPDATE users
SET _id = gen_random_uuid()
WHERE _id::text !~* '^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$';

UPDATE zones
SET _id = gen_random_uuid()
WHERE _id::text !~* '^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$';

COMMIT;
