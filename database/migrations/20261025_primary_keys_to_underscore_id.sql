/* Rename existing UUID primary columns only. Keep every row, UUID, FK and index.
 * Standalone transactional SQL; run against the intended MillionX database.
 * Re-running on the completed schema is safe. Stop incompatible old backends first.
 */
BEGIN;
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '30s';
SELECT pg_advisory_xact_lock(20261025, 1);

LOCK TABLE ecommerce.categories, ecommerce.products, ecommerce.product_variants,
  ecommerce.product_prices, ecommerce.product_images, ecommerce.customers,
  ecommerce.customer_accounts, ecommerce.customer_social_accounts, ecommerce.addresses,
  ecommerce.users, ecommerce.zones IN ACCESS EXCLUSIVE MODE;

CREATE TEMP TABLE millionx_pk_rename_audit (
  table_name text PRIMARY KEY, row_count bigint, row_hash text
) ON COMMIT DROP;
CREATE TEMP TABLE millionx_pk_rename_constraints ON COMMIT DROP AS
  SELECT oid, conrelid, confrelid, contype, conkey, confkey, conindid,
    convalidated, confupdtype, confdeltype
  FROM pg_constraint WHERE connamespace = 'ecommerce'::regnamespace;
CREATE TEMP TABLE millionx_pk_rename_indexes ON COMMIT DROP AS
  SELECT indexrelid, indrelid, indisunique, indisprimary, indisvalid, indkey::text,
    indexprs::text, indpred::text
  FROM pg_index WHERE indrelid IN (
    SELECT oid FROM pg_class WHERE relnamespace = 'ecommerce'::regnamespace
  );

DO $migration$
DECLARE
  task_table text;
  old_column boolean;
  new_column boolean;
  pk_column text;
BEGIN
  FOREACH task_table IN ARRAY ARRAY['categories','products','product_variants',
    'product_prices','product_images','customers','customer_accounts',
    'customer_social_accounts','addresses','users','zones']
  LOOP
    SELECT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='ecommerce'
      AND table_name=task_table AND column_name='id'),
      EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='ecommerce'
      AND table_name=task_table AND column_name='_id') INTO old_column, new_column;
    IF old_column = new_column THEN
      RAISE EXCEPTION 'Expected exactly one UUID PK id/_id in ecommerce.%', task_table;
    END IF;
    pk_column := CASE WHEN old_column THEN 'id' ELSE '_id' END;
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint c
      JOIN pg_attribute a ON a.attrelid=c.conrelid AND a.attnum=c.conkey[1]
      WHERE c.conrelid=format('ecommerce.%I',task_table)::regclass AND c.contype='p'
        AND cardinality(c.conkey)=1 AND a.attname=pk_column AND a.atttypid='uuid'::regtype
    ) THEN RAISE EXCEPTION 'Unexpected primary key on ecommerce.%', task_table; END IF;
    EXECUTE format($snapshot$
      INSERT INTO millionx_pk_rename_audit
      SELECT %L, count(*), md5(coalesce(string_agg(data::text,'' ORDER BY data->>'_id'),''))
      FROM (SELECT (to_jsonb(t) - 'id' - '_id') || jsonb_build_object('_id',to_jsonb(t)->%L) AS data
        FROM ecommerce.%I t) normalized
    $snapshot$,task_table,pk_column,task_table);
    IF old_column THEN
      EXECUTE format('ALTER TABLE ecommerce.%I RENAME COLUMN id TO _id',task_table);
    END IF;
  END LOOP;
END $migration$;

/* PL/pgSQL source references must be updated explicitly after renaming columns. */
CREATE OR REPLACE FUNCTION ecommerce.prevent_category_cycle()
RETURNS trigger LANGUAGE plpgsql SET search_path = pg_catalog, ecommerce AS $function$
DECLARE cycle_found boolean;
BEGIN
  IF NEW."parentId" IS NULL THEN RETURN NEW; END IF;
  WITH RECURSIVE ancestors AS (
    SELECT _id,"parentId" FROM ecommerce.categories WHERE _id=NEW."parentId"
    UNION
    SELECT c._id,c."parentId" FROM ecommerce.categories c JOIN ancestors a ON c._id=a."parentId"
  ) SELECT EXISTS(SELECT 1 FROM ancestors WHERE _id=NEW._id) INTO cycle_found;
  IF cycle_found THEN RAISE EXCEPTION 'Category hierarchy cannot contain a cycle'; END IF;
  RETURN NEW;
END $function$;

DO $verify$
DECLARE task_row record; current_count bigint; current_hash text;
BEGIN
  FOR task_row IN SELECT * FROM millionx_pk_rename_audit LOOP
    EXECUTE format($snapshot$
      SELECT count(*),md5(coalesce(string_agg(to_jsonb(t)::text,'' ORDER BY _id::text),''))
      FROM ecommerce.%I t
    $snapshot$,task_row.table_name) INTO current_count,current_hash;
    IF current_count <> task_row.row_count OR current_hash <> task_row.row_hash THEN
      RAISE EXCEPTION 'Data changed unexpectedly in ecommerce.%',task_row.table_name;
    END IF;
  END LOOP;
  IF EXISTS (
    (SELECT * FROM millionx_pk_rename_constraints EXCEPT
      SELECT oid,conrelid,confrelid,contype,conkey,confkey,conindid,convalidated,confupdtype,confdeltype
      FROM pg_constraint WHERE connamespace='ecommerce'::regnamespace)
    UNION ALL
    (SELECT oid,conrelid,confrelid,contype,conkey,confkey,conindid,convalidated,confupdtype,confdeltype
      FROM pg_constraint WHERE connamespace='ecommerce'::regnamespace
      EXCEPT SELECT * FROM millionx_pk_rename_constraints)
  ) THEN RAISE EXCEPTION 'Constraint identities or relationships changed'; END IF;
  IF EXISTS (
    (SELECT * FROM millionx_pk_rename_indexes EXCEPT
      SELECT indexrelid,indrelid,indisunique,indisprimary,indisvalid,indkey::text,indexprs::text,indpred::text
      FROM pg_index WHERE indrelid IN (SELECT oid FROM pg_class WHERE relnamespace='ecommerce'::regnamespace))
    UNION ALL
    (SELECT indexrelid,indrelid,indisunique,indisprimary,indisvalid,indkey::text,indexprs::text,indpred::text
      FROM pg_index WHERE indrelid IN (SELECT oid FROM pg_class WHERE relnamespace='ecommerce'::regnamespace)
      EXCEPT SELECT * FROM millionx_pk_rename_indexes)
  ) THEN RAISE EXCEPTION 'Index identities or definitions changed'; END IF;
  PERFORM 1 FROM ecommerce.catalog_browser LIMIT 1;
END $verify$;

SELECT table_name,row_count,'preserved' AS data_status FROM millionx_pk_rename_audit ORDER BY table_name;
COMMIT;
