/* Phase 01 — Foundation | PostgreSQL 15 | UUID | Creates 8 E-commerce tables */
BEGIN;
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE SCHEMA IF NOT EXISTS ecommerce;
SET search_path TO ecommerce, public;

DO $$ BEGIN
  IF to_regclass('ecommerce.categories') IS NOT NULL THEN
    RAISE EXCEPTION 'Phase 01 exists. Use migrations or rollback; do not rerun blindly.';
  END IF;
END $$;

CREATE TABLE categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "parentId" uuid REFERENCES categories(id) ON DELETE RESTRICT,
  name varchar(150) NOT NULL,
  slug varchar(180) NOT NULL UNIQUE,
  description text,
  "sortOrder" integer NOT NULL DEFAULT 0 CHECK ("sortOrder" >= 0),
  "isActive" boolean NOT NULL DEFAULT true,
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  "updatedAt" timestamptz NOT NULL DEFAULT now(),
  CHECK ("parentId" IS NULL OR "parentId" <> id)
);

CREATE TABLE products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "categoryId" uuid NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
  name varchar(200) NOT NULL,
  slug varchar(220) NOT NULL UNIQUE,
  description text,
  brand varchar(150),
  "isActive" boolean NOT NULL DEFAULT true,
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  "updatedAt" timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE product_variants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "productId" uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  sku varchar(100) NOT NULL UNIQUE,
  barcode varchar(100),
  name varchar(160),
  attributes jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(attributes)='object'),
  "isActive" boolean NOT NULL DEFAULT true,
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  "updatedAt" timestamptz NOT NULL DEFAULT now(),
  UNIQUE (id, "productId")
);
CREATE UNIQUE INDEX uq_product_variants_barcode ON product_variants(barcode) WHERE barcode IS NOT NULL;

CREATE TABLE product_prices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "variantId" uuid NOT NULL REFERENCES product_variants(id) ON DELETE CASCADE,
  currency char(3) NOT NULL CHECK (currency=upper(currency)),
  amount numeric(14,2) NOT NULL CHECK (amount >= 0),
  "compareAtAmount" numeric(14,2) CHECK ("compareAtAmount" IS NULL OR "compareAtAmount" >= amount),
  "startsAt" timestamptz,
  "endsAt" timestamptz,
  "isActive" boolean NOT NULL DEFAULT true,
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  "updatedAt" timestamptz NOT NULL DEFAULT now(),
  CHECK ("endsAt" IS NULL OR "startsAt" IS NULL OR "endsAt" > "startsAt")
);
CREATE UNIQUE INDEX uq_open_variant_price ON product_prices("variantId",currency)
  WHERE "isActive" AND "endsAt" IS NULL;

CREATE TABLE product_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "productId" uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  "variantId" uuid,
  url text NOT NULL,
  "altText" varchar(250),
  "sortOrder" integer NOT NULL DEFAULT 0 CHECK ("sortOrder" >= 0),
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY ("variantId","productId") REFERENCES product_variants(id,"productId") ON DELETE CASCADE
);

CREATE TABLE customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "firstName" varchar(120),
  "lastName" varchar(120),
  email varchar(320),
  phone varchar(40),
  "isActive" boolean NOT NULL DEFAULT true,
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  "updatedAt" timestamptz NOT NULL DEFAULT now(),
  CHECK (email IS NOT NULL OR phone IS NOT NULL)
);
CREATE UNIQUE INDEX uq_customers_email_ci ON customers(lower(email)) WHERE email IS NOT NULL;
CREATE UNIQUE INDEX uq_customers_phone ON customers(phone) WHERE phone IS NOT NULL;

CREATE TABLE customer_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "customerId" uuid NOT NULL UNIQUE REFERENCES customers(id) ON DELETE CASCADE,
  "passwordHash" varchar(255) NOT NULL,
  "isActive" boolean NOT NULL DEFAULT true,
  "emailVerifiedAt" timestamptz,
  "phoneVerifiedAt" timestamptz,
  "lastLoginAt" timestamptz,
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  "updatedAt" timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE addresses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "customerId" uuid NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  label varchar(80) NOT NULL,
  "recipientName" varchar(200) NOT NULL,
  phone varchar(40) NOT NULL,
  "addressLine1" varchar(250) NOT NULL,
  "addressLine2" varchar(250),
  village varchar(150),
  district varchar(150),
  province varchar(150) NOT NULL,
  "postalCode" varchar(30),
  "countryCode" char(2) NOT NULL DEFAULT 'LA' CHECK ("countryCode"=upper("countryCode")),
  latitude numeric(9,6) CHECK (latitude BETWEEN -90 AND 90),
  longitude numeric(9,6) CHECK (longitude BETWEEN -180 AND 180),
  "isDefault" boolean NOT NULL DEFAULT false,
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  "updatedAt" timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX uq_customer_default_address ON addresses("customerId") WHERE "isDefault";

CREATE INDEX idx_categories_parent_sort ON categories("parentId","sortOrder");
CREATE INDEX idx_products_category_active ON products("categoryId","isActive");
CREATE INDEX idx_variants_product_active ON product_variants("productId","isActive");
CREATE INDEX idx_prices_lookup ON product_prices("variantId",currency,"isActive","startsAt","endsAt");
CREATE INDEX idx_images_product_sort ON product_images("productId","sortOrder");
CREATE INDEX idx_images_variant ON product_images("variantId");
CREATE INDEX idx_addresses_customer ON addresses("customerId");
CREATE INDEX idx_customer_accounts_active ON customer_accounts("customerId","isActive");

CREATE OR REPLACE FUNCTION prevent_category_cycle() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE cycle_found boolean;
BEGIN
  IF NEW."parentId" IS NULL THEN RETURN NEW; END IF;
  WITH RECURSIVE ancestors AS (
    SELECT id,"parentId" FROM categories WHERE id=NEW."parentId"
    UNION ALL
    SELECT c.id,c."parentId" FROM categories c JOIN ancestors a ON c.id=a."parentId"
  ) SELECT EXISTS(SELECT 1 FROM ancestors WHERE id=NEW.id) INTO cycle_found;
  IF cycle_found THEN RAISE EXCEPTION 'Category hierarchy cannot contain a cycle'; END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER trg_prevent_category_cycle BEFORE INSERT OR UPDATE OF "parentId" ON categories
FOR EACH ROW EXECUTE FUNCTION prevent_category_cycle();

CREATE OR REPLACE VIEW catalog_browser AS
SELECT c.id AS "categoryId",c.name AS "categoryName",p.id AS "productId",p.name AS "productName",
       p.slug AS "productSlug",v.id AS "variantId",v.sku,v.name AS "variantName",v.attributes,
       pp.currency,pp.amount,pp."compareAtAmount"
FROM categories c JOIN products p ON p."categoryId"=c.id
JOIN product_variants v ON v."productId"=p.id JOIN product_prices pp ON pp."variantId"=v.id
WHERE c."isActive" AND p."isActive" AND v."isActive" AND pp."isActive"
  AND (pp."startsAt" IS NULL OR pp."startsAt"<=now()) AND (pp."endsAt" IS NULL OR pp."endsAt">now());

COMMIT;
SELECT table_name FROM information_schema.tables
WHERE table_schema='ecommerce' AND table_type='BASE TABLE' ORDER BY table_name;
