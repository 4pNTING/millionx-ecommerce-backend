/* Development data for Phase 01. Safe to rerun; PostgreSQL generates UUID v4 IDs. */
BEGIN;
SET search_path TO ecommerce, public;

INSERT INTO categories("parentId",name,slug,"sortOrder")
VALUES (NULL,'ເຄື່ອງເອເລັກໂຕຣນິກ','electronics',1)
ON CONFLICT(slug) DO UPDATE SET name=EXCLUDED.name,"sortOrder"=EXCLUDED."sortOrder";

INSERT INTO categories("parentId",name,slug,"sortOrder")
VALUES ((SELECT id FROM categories WHERE slug='electronics'),'ຄອມພິວເຕີ','computers',1)
ON CONFLICT(slug) DO UPDATE SET "parentId"=EXCLUDED."parentId",name=EXCLUDED.name,"sortOrder"=EXCLUDED."sortOrder";

INSERT INTO categories("parentId",name,slug,"sortOrder") VALUES
((SELECT id FROM categories WHERE slug='computers'),'ແລັບທັອບ','laptops',1),
((SELECT id FROM categories WHERE slug='computers'),'ຄອມພິວເຕີຕັ້ງໂຕະ','desktop-computers',2),
((SELECT id FROM categories WHERE slug='electronics'),'ໂທລະສັບມືຖື','mobile-phones',2),
((SELECT id FROM categories WHERE slug='electronics'),'ຫູຟັງ','headphones',3)
ON CONFLICT(slug) DO UPDATE SET "parentId"=EXCLUDED."parentId",name=EXCLUDED.name,"sortOrder"=EXCLUDED."sortOrder";

INSERT INTO categories("parentId",name,slug,"sortOrder")
VALUES (NULL,'ແຟຊັ່ນ','fashion',2)
ON CONFLICT(slug) DO UPDATE SET name=EXCLUDED.name,"sortOrder"=EXCLUDED."sortOrder";

INSERT INTO categories("parentId",name,slug,"sortOrder") VALUES
((SELECT id FROM categories WHERE slug='fashion'),'ເຄື່ອງນຸ່ງຜູ້ຊາຍ','mens-clothing',1),
((SELECT id FROM categories WHERE slug='fashion'),'ເຄື່ອງນຸ່ງຜູ້ຍິງ','womens-clothing',2),
((SELECT id FROM categories WHERE slug='fashion'),'ເກີບ','shoes',3)
ON CONFLICT(slug) DO UPDATE SET "parentId"=EXCLUDED."parentId",name=EXCLUDED.name,"sortOrder"=EXCLUDED."sortOrder";

INSERT INTO products("categoryId",name,slug,description,brand) VALUES
((SELECT id FROM categories WHERE slug='laptops'),'ແລັບທັອບສຳລັບໃຊ້ງານປະຈຳວັນ','everyday-laptop','ແລັບທັອບສຳລັບການຮຽນ ແລະ ວຽກຫ້ອງການ','MillionX Tech'),
((SELECT id FROM categories WHERE slug='headphones'),'ຫູຟັງໄຮ້ສາຍ','wireless-headphones','ຫູຟັງ Bluetooth ສຳລັບໃຊ້ງານປະຈຳວັນ','MillionX Sound')
ON CONFLICT(slug) DO UPDATE SET "categoryId"=EXCLUDED."categoryId",name=EXCLUDED.name,description=EXCLUDED.description,brand=EXCLUDED.brand;

INSERT INTO product_variants("productId",sku,barcode,name,attributes) VALUES
((SELECT id FROM products WHERE slug='everyday-laptop'),'LAP-8-256-SLV','8850000000001','RAM 8GB / SSD 256GB / ສີເງິນ','{"ram":"8GB","storage":"256GB","color":"silver"}'),
((SELECT id FROM products WHERE slug='everyday-laptop'),'LAP-16-512-BLK','8850000000002','RAM 16GB / SSD 512GB / ສີດຳ','{"ram":"16GB","storage":"512GB","color":"black"}'),
((SELECT id FROM products WHERE slug='wireless-headphones'),'HP-WL-BLK-001','8850000000003','ສີດຳ','{"color":"black","connectivity":"Bluetooth 5.3"}')
ON CONFLICT(sku) DO UPDATE SET "productId"=EXCLUDED."productId",barcode=EXCLUDED.barcode,name=EXCLUDED.name,attributes=EXCLUDED.attributes;

INSERT INTO product_prices("variantId",currency,amount,"compareAtAmount") VALUES
((SELECT id FROM product_variants WHERE sku='LAP-8-256-SLV'),'LAK',8500000,9000000),
((SELECT id FROM product_variants WHERE sku='LAP-16-512-BLK'),'LAK',11500000,12000000),
((SELECT id FROM product_variants WHERE sku='HP-WL-BLK-001'),'LAK',1050000,1250000),
((SELECT id FROM product_variants WHERE sku='HP-WL-BLK-001'),'USD',49.90,59.90)
ON CONFLICT("variantId",currency) WHERE "isActive" AND "endsAt" IS NULL
DO UPDATE SET amount=EXCLUDED.amount,"compareAtAmount"=EXCLUDED."compareAtAmount";

INSERT INTO product_images("productId","variantId",url,"altText","sortOrder")
SELECT p.id,NULL,'https://example.com/images/everyday-laptop.jpg','ຮູບແລັບທັອບສຳລັບໃຊ້ງານປະຈຳວັນ',0
FROM products p WHERE p.slug='everyday-laptop'
AND NOT EXISTS (SELECT 1 FROM product_images i WHERE i."productId"=p.id AND i.url='https://example.com/images/everyday-laptop.jpg');

INSERT INTO product_images("productId","variantId",url,"altText","sortOrder")
SELECT p.id,v.id,'https://example.com/images/headphones-black.jpg','ຮູບຫູຟັງໄຮ້ສາຍສີດຳ',0
FROM products p JOIN product_variants v ON v."productId"=p.id
WHERE p.slug='wireless-headphones' AND v.sku='HP-WL-BLK-001'
AND NOT EXISTS (SELECT 1 FROM product_images i WHERE i."productId"=p.id AND i.url='https://example.com/images/headphones-black.jpg');

INSERT INTO customers("firstName","lastName",email,phone)
VALUES ('ສົມພອນ','ໄຊຍະວົງ','demo.customer@example.com','+8562012345678')
ON CONFLICT DO NOTHING;

INSERT INTO addresses("customerId",label,"recipientName",phone,"addressLine1",village,district,province,"countryCode","isDefault")
SELECT c.id,'ເຮືອນ','ສົມພອນ ໄຊຍະວົງ','+8562012345678','ເຮືອນເລກທີ 123 ຖະໜົນສາມແສນໄທ','ບ້ານສີສະຫວາດ','ເມືອງຈັນທະບູລີ','ນະຄອນຫຼວງວຽງຈັນ','LA',true
FROM customers c WHERE lower(c.email)=lower('demo.customer@example.com')
AND NOT EXISTS (SELECT 1 FROM addresses a WHERE a."customerId"=c.id AND a."isDefault");

COMMIT;

SELECT * FROM ecommerce.catalog_browser ORDER BY "productName","variantName",currency;
