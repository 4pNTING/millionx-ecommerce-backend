/* Migration: Phase 03 — Order & Inventory | PostgreSQL 15 | UUID */
BEGIN;
CREATE SCHEMA IF NOT EXISTS ecommerce;
SET search_path TO ecommerce, public;

CREATE TABLE IF NOT EXISTS orders (
  _id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "orderNumber" varchar(64) NOT NULL UNIQUE,
  "customerId" uuid NOT NULL REFERENCES customers(_id) ON UPDATE CASCADE ON DELETE RESTRICT,
  "checkoutSessionId" uuid REFERENCES checkout_sessions(_id) ON UPDATE CASCADE ON DELETE SET NULL,
  subtotal numeric(14,2) NOT NULL DEFAULT 0.00 CHECK (subtotal >= 0),
  "discountAmount" numeric(14,2) NOT NULL DEFAULT 0.00 CHECK ("discountAmount" >= 0),
  "shippingAmount" numeric(14,2) NOT NULL DEFAULT 0.00 CHECK ("shippingAmount" >= 0),
  "taxAmount" numeric(14,2) NOT NULL DEFAULT 0.00 CHECK ("taxAmount" >= 0),
  total numeric(14,2) NOT NULL DEFAULT 0.00 CHECK (total >= 0),
  currency char(3) NOT NULL CHECK (currency = upper(currency)),
  status varchar(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'processing', 'completed', 'cancelled')),
  "shippingAddress" jsonb NOT NULL CHECK (jsonb_typeof("shippingAddress") = 'object'),
  "billingAddress" jsonb CHECK ("billingAddress" IS NULL OR jsonb_typeof("billingAddress") = 'object'),
  notes text,
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  "updatedAt" timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders("customerId");
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON orders("orderNumber");
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders("createdAt" DESC);

CREATE TABLE IF NOT EXISTS order_items (
  _id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "orderId" uuid NOT NULL REFERENCES orders(_id) ON UPDATE CASCADE ON DELETE CASCADE,
  "variantId" uuid NOT NULL REFERENCES product_variants(_id) ON UPDATE CASCADE ON DELETE RESTRICT,
  sku varchar(100) NOT NULL,
  "productName" varchar(255) NOT NULL,
  "variantName" varchar(255) NOT NULL,
  quantity integer NOT NULL CHECK (quantity > 0),
  "unitPrice" numeric(14,2) NOT NULL CHECK ("unitPrice" >= 0),
  subtotal numeric(14,2) NOT NULL CHECK (subtotal >= 0),
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_order_variant UNIQUE ("orderId", "variantId")
);

CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items("orderId");
CREATE INDEX IF NOT EXISTS idx_order_items_variant ON order_items("variantId");

CREATE TABLE IF NOT EXISTS order_status_history (
  _id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "orderId" uuid NOT NULL REFERENCES orders(_id) ON UPDATE CASCADE ON DELETE CASCADE,
  "fromStatus" varchar(50),
  "toStatus" varchar(50) NOT NULL,
  note text,
  "createdBy" varchar(100) NOT NULL DEFAULT 'system',
  "createdAt" timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_order_status_history_order ON order_status_history("orderId");

CREATE TABLE IF NOT EXISTS inventory (
  _id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "variantId" uuid NOT NULL UNIQUE REFERENCES product_variants(_id) ON UPDATE CASCADE ON DELETE CASCADE,
  "onHand" integer NOT NULL DEFAULT 0 CHECK ("onHand" >= 0),
  reserved integer NOT NULL DEFAULT 0 CHECK ("reserved" >= 0),
  available integer NOT NULL DEFAULT 0 CHECK ("available" >= 0),
  "updatedAt" timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT chk_inventory_available CHECK ("available" = "onHand" - reserved)
);

CREATE INDEX IF NOT EXISTS idx_inventory_variant ON inventory("variantId");

CREATE TABLE IF NOT EXISTS inventory_movements (
  _id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "variantId" uuid NOT NULL REFERENCES product_variants(_id) ON UPDATE CASCADE ON DELETE CASCADE,
  type varchar(50) NOT NULL CHECK (type IN ('inbound', 'outbound', 'reserved', 'released', 'adjustment')),
  quantity integer NOT NULL,
  "referenceType" varchar(50) NOT NULL CHECK ("referenceType" IN ('order', 'purchase_order', 'manual_adjustment', 'reservation_release')),
  "referenceId" uuid,
  note text,
  "createdAt" timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_inventory_movements_variant ON inventory_movements("variantId");
CREATE INDEX IF NOT EXISTS idx_inventory_movements_reference ON inventory_movements("referenceType", "referenceId");

CREATE TABLE IF NOT EXISTS inventory_reservations (
  _id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "orderId" uuid NOT NULL REFERENCES orders(_id) ON UPDATE CASCADE ON DELETE CASCADE,
  "variantId" uuid NOT NULL REFERENCES product_variants(_id) ON UPDATE CASCADE ON DELETE CASCADE,
  quantity integer NOT NULL CHECK (quantity > 0),
  status varchar(50) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'consumed', 'released', 'expired')),
  "expiresAt" timestamptz NOT NULL,
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  "updatedAt" timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_inventory_reservations_order ON inventory_reservations("orderId");
CREATE INDEX IF NOT EXISTS idx_inventory_reservations_status_expiry ON inventory_reservations(status, "expiresAt");

-- Initial Inventory Seed for existing product variants (default 100 onHand, 100 available)
INSERT INTO inventory (_id, "variantId", "onHand", reserved, available, "updatedAt")
SELECT gen_random_uuid(), _id, 100, 0, 100, now()
FROM product_variants
ON CONFLICT ("variantId") DO NOTHING;

COMMIT;
