/* Phase 02 — Shopping | PostgreSQL 15 | UUID | Carts, Checkout Sessions & Wishlists */
BEGIN;
CREATE SCHEMA IF NOT EXISTS ecommerce;
SET search_path TO ecommerce, public;

CREATE TABLE IF NOT EXISTS carts (
  _id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "customerId" uuid REFERENCES customers(_id) ON UPDATE CASCADE ON DELETE CASCADE,
  "sessionId" varchar(120),
  "isActive" boolean NOT NULL DEFAULT true,
  "mergedIntoCartId" uuid REFERENCES carts(_id) ON UPDATE CASCADE ON DELETE SET NULL,
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  "updatedAt" timestamptz NOT NULL DEFAULT now(),
  CHECK ("customerId" IS NOT NULL OR "sessionId" IS NOT NULL)
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_customer_active_cart ON carts("customerId")
  WHERE "isActive" AND "customerId" IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS uq_session_active_cart ON carts("sessionId")
  WHERE "isActive" AND "customerId" IS NULL AND "sessionId" IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_carts_customer_active ON carts("customerId", "isActive");
CREATE INDEX IF NOT EXISTS idx_carts_session_active ON carts("sessionId", "isActive");

CREATE TABLE IF NOT EXISTS cart_items (
  _id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "cartId" uuid NOT NULL REFERENCES carts(_id) ON UPDATE CASCADE ON DELETE CASCADE,
  "variantId" uuid NOT NULL REFERENCES product_variants(_id) ON UPDATE CASCADE ON DELETE RESTRICT,
  quantity integer NOT NULL CHECK (quantity > 0),
  "addedAt" timestamptz NOT NULL DEFAULT now(),
  "updatedAt" timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_cart_variant UNIQUE ("cartId", "variantId")
);

CREATE INDEX IF NOT EXISTS idx_cart_items_cart ON cart_items("cartId");
CREATE INDEX IF NOT EXISTS idx_cart_items_variant ON cart_items("variantId");

CREATE TABLE IF NOT EXISTS checkout_sessions (
  _id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "cartId" uuid NOT NULL REFERENCES carts(_id) ON UPDATE CASCADE ON DELETE RESTRICT,
  "customerId" uuid REFERENCES customers(_id) ON UPDATE CASCADE ON DELETE SET NULL,
  subtotal numeric(14,2) NOT NULL DEFAULT 0.00 CHECK (subtotal >= 0),
  "discountAmount" numeric(14,2) NOT NULL DEFAULT 0.00 CHECK ("discountAmount" >= 0),
  "shippingAmount" numeric(14,2) NOT NULL DEFAULT 0.00 CHECK ("shippingAmount" >= 0),
  "taxAmount" numeric(14,2) NOT NULL DEFAULT 0.00 CHECK ("taxAmount" >= 0),
  total numeric(14,2) NOT NULL DEFAULT 0.00 CHECK (total >= 0),
  currency char(3) NOT NULL CHECK (currency = upper(currency)),
  "priceSnapshot" jsonb NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof("priceSnapshot") = 'array'),
  status varchar(50) NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'completed', 'expired', 'abandoned')),
  "expiresAt" timestamptz NOT NULL,
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  "updatedAt" timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_checkout_sessions_cart ON checkout_sessions("cartId");
CREATE INDEX IF NOT EXISTS idx_checkout_sessions_customer ON checkout_sessions("customerId");
CREATE INDEX IF NOT EXISTS idx_checkout_sessions_status_expiry ON checkout_sessions(status, "expiresAt");

CREATE TABLE IF NOT EXISTS wishlists (
  _id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "customerId" uuid NOT NULL UNIQUE REFERENCES customers(_id) ON UPDATE CASCADE ON DELETE CASCADE,
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  "updatedAt" timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_wishlists_customer ON wishlists("customerId");

CREATE TABLE IF NOT EXISTS wishlist_items (
  _id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "wishlistId" uuid NOT NULL REFERENCES wishlists(_id) ON UPDATE CASCADE ON DELETE CASCADE,
  "productId" uuid NOT NULL REFERENCES products(_id) ON UPDATE CASCADE ON DELETE CASCADE,
  "addedAt" timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_wishlist_product UNIQUE ("wishlistId", "productId")
);

CREATE INDEX IF NOT EXISTS idx_wishlist_items_wishlist ON wishlist_items("wishlistId");
CREATE INDEX IF NOT EXISTS idx_wishlist_items_product ON wishlist_items("productId");

COMMIT;

