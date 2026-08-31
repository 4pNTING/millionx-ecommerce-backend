/*
  Phase 01 migration: separate employee/staff auth from customer auth.
  Safe to run once on the existing millionx_ecommerce database.
*/
BEGIN;

ALTER TABLE ecommerce.users ALTER COLUMN role SET DEFAULT 'staff';

ALTER TABLE ecommerce.customers
  DROP COLUMN IF EXISTS "authUserId";

CREATE TABLE IF NOT EXISTS ecommerce.customer_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "customerId" uuid NOT NULL UNIQUE
    REFERENCES ecommerce.customers(id) ON DELETE CASCADE,
  "passwordHash" varchar(255) NOT NULL,
  "isActive" boolean NOT NULL DEFAULT true,
  "emailVerifiedAt" timestamptz,
  "phoneVerifiedAt" timestamptz,
  "lastLoginAt" timestamptz,
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  "updatedAt" timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_customer_accounts_active
  ON ecommerce.customer_accounts("customerId","isActive");

COMMIT;
