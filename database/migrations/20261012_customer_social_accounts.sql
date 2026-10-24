/*
  Migration: Create customer_social_accounts table
  Supports Social Login for Google and Facebook
*/
BEGIN;

CREATE TABLE IF NOT EXISTS ecommerce.customer_social_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "customerId" uuid NOT NULL REFERENCES ecommerce.customers(id) ON DELETE CASCADE,
  provider varchar(30) NOT NULL,
  "providerId" varchar(255) NOT NULL,
  email varchar(320),
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  "updatedAt" timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_customer_provider UNIQUE (provider, "providerId")
);

CREATE INDEX IF NOT EXISTS idx_customer_social_customer_id
  ON ecommerce.customer_social_accounts("customerId");

COMMIT;
