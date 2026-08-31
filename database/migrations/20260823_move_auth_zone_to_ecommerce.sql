/*
  Move Staff/Auth and Zone objects from public to ecommerce without losing data.
  Safe to run once; also safe when the objects are already in ecommerce.
*/
BEGIN;

CREATE SCHEMA IF NOT EXISTS ecommerce;

DO $$
BEGIN
  IF to_regclass('public.users') IS NOT NULL
     AND to_regclass('ecommerce.users') IS NOT NULL THEN
    RAISE EXCEPTION 'Both public.users and ecommerce.users exist; merge them manually before migration.';
  ELSIF to_regclass('public.users') IS NOT NULL THEN
    ALTER TABLE public.users SET SCHEMA ecommerce;
  END IF;

  IF to_regclass('public.zones') IS NOT NULL
     AND to_regclass('ecommerce.zones') IS NOT NULL THEN
    RAISE EXCEPTION 'Both public.zones and ecommerce.zones exist; merge them manually before migration.';
  ELSIF to_regclass('public.zones') IS NOT NULL THEN
    ALTER TABLE public.zones SET SCHEMA ecommerce;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'public' AND t.typname = 'user_role'
  ) AND NOT EXISTS (
    SELECT 1
    FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'ecommerce' AND t.typname = 'user_role'
  ) THEN
    ALTER TYPE public.user_role SET SCHEMA ecommerce;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'public' AND t.typname = 'active_status'
  ) AND NOT EXISTS (
    SELECT 1
    FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'ecommerce' AND t.typname = 'active_status'
  ) THEN
    ALTER TYPE public.active_status SET SCHEMA ecommerce;
  END IF;
END $$;

COMMIT;

SELECT table_schema, table_name
FROM information_schema.tables
WHERE table_name IN ('users', 'zones')
ORDER BY table_schema, table_name;
