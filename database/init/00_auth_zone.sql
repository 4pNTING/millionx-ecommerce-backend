/* Phase 01 — Staff/Auth and Zone tables inside the ecommerce schema. */
BEGIN;
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE SCHEMA IF NOT EXISTS ecommerce;
SET search_path TO ecommerce, public;

CREATE TYPE user_role AS ENUM ('manager','admin','staff');
CREATE TYPE active_status AS ENUM ('active','inactive','all');

CREATE TABLE users (
  _id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username varchar(150) NOT NULL UNIQUE,
  password varchar(255) NOT NULL,
  role user_role NOT NULL DEFAULT 'staff',
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  "updatedAt" timestamptz NOT NULL DEFAULT now(),
  "deletedAt" timestamptz,
  "isActive" active_status NOT NULL DEFAULT 'active'
);

CREATE TABLE zones (
  _id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "uniqueId" integer NOT NULL DEFAULT 0,
  uid varchar(255),
  name varchar(255) NOT NULL UNIQUE,
  "isActive" active_status NOT NULL DEFAULT 'active',
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  "updatedAt" timestamptz NOT NULL DEFAULT now(),
  "deletedAt" timestamptz
);

CREATE INDEX idx_users_active ON users("isActive") WHERE "deletedAt" IS NULL;
CREATE INDEX idx_zones_active ON zones("isActive") WHERE "deletedAt" IS NULL;
COMMIT;
