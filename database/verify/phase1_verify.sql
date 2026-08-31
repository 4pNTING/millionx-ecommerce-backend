SELECT current_database() AS "databaseName";

SELECT table_schema,table_name
FROM information_schema.tables
WHERE table_schema='ecommerce' AND table_type='BASE TABLE'
ORDER BY table_schema,table_name;

SELECT count(*) AS "phase1EcommerceTableCount"
FROM information_schema.tables
WHERE table_schema='ecommerce' AND table_type='BASE TABLE';

SELECT c.id,c.email,c.phone,ca.id AS "accountId",ca."isActive",ca."lastLoginAt"
FROM ecommerce.customers c
LEFT JOIN ecommerce.customer_accounts ca ON ca."customerId"=c.id
ORDER BY c."createdAt";

SELECT * FROM ecommerce.catalog_browser
ORDER BY "productName","variantName",currency LIMIT 50;
