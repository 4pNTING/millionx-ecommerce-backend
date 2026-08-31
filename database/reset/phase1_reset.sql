/* Reset all E-commerce Phase 1 tables, including Staff/Auth and Zone data. */
BEGIN;
DROP SCHEMA IF EXISTS ecommerce CASCADE;
COMMIT;
