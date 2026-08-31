/* Development seed for Phase 01. Safe to rerun. */
BEGIN;
SET search_path TO ecommerce, public;

INSERT INTO categories(id,"parentId",name,slug,"sortOrder") VALUES
('10000000-0000-0000-0000-000000000001',NULL,'ເຄື່ອງເອເລັກໂຕຣນິກ','electronics',1),
('10000000-0000-0000-0000-000000000002','10000000-0000-0000-0000-000000000001','ຄອມພິວເຕີ','computers',1),
('10000000-0000-0000-0000-000000000003','10000000-0000-0000-0000-000000000002','ແລັບທັອບ','laptops',1),
('10000000-0000-0000-0000-000000000004','10000000-0000-0000-0000-000000000002','ຄອມພິວເຕີຕັ້ງໂຕະ','desktop-computers',2),
('10000000-0000-0000-0000-000000000005','10000000-0000-0000-0000-000000000001','ໂທລະສັບມືຖື','mobile-phones',2),
('10000000-0000-0000-0000-000000000006','10000000-0000-0000-0000-000000000001','ຫູຟັງ','headphones',3),
('10000000-0000-0000-0000-000000000007',NULL,'ແຟຊັ່ນ','fashion',2),
('10000000-0000-0000-0000-000000000008','10000000-0000-0000-0000-000000000007','ເຄື່ອງນຸ່ງຜູ້ຊາຍ','mens-clothing',1),
('10000000-0000-0000-0000-000000000009','10000000-0000-0000-0000-000000000007','ເຄື່ອງນຸ່ງຜູ້ຍິງ','womens-clothing',2),
('10000000-0000-0000-0000-000000000010','10000000-0000-0000-0000-000000000007','ເກີບ','shoes',3)
ON CONFLICT(id) DO NOTHING;

INSERT INTO products(id,"categoryId",name,slug,description,brand) VALUES
('20000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000003',
 'ແລັບທັອບສຳລັບໃຊ້ງານປະຈຳວັນ','everyday-laptop','ແລັບທັອບສຳລັບການຮຽນ ແລະ ວຽກຫ້ອງການ','MillionX Tech'),
('20000000-0000-0000-0000-000000000002','10000000-0000-0000-0000-000000000006',
 'ຫູຟັງໄຮ້ສາຍ','wireless-headphones','ຫູຟັງ Bluetooth ສຳລັບໃຊ້ງານປະຈຳວັນ','MillionX Sound')
ON CONFLICT(id) DO NOTHING;

INSERT INTO product_variants(id,"productId",sku,barcode,name,attributes) VALUES
('30000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000001',
 'LAP-8-256-SLV','8850000000001','RAM 8GB / SSD 256GB / ສີເງິນ','{"ram":"8GB","storage":"256GB","color":"silver"}'),
('30000000-0000-0000-0000-000000000002','20000000-0000-0000-0000-000000000001',
 'LAP-16-512-BLK','8850000000002','RAM 16GB / SSD 512GB / ສີດຳ','{"ram":"16GB","storage":"512GB","color":"black"}'),
('30000000-0000-0000-0000-000000000003','20000000-0000-0000-0000-000000000002',
 'HP-WL-BLK-001','8850000000003','ສີດຳ','{"color":"black","connectivity":"Bluetooth 5.3"}')
ON CONFLICT(id) DO NOTHING;

INSERT INTO product_prices(id,"variantId",currency,amount,"compareAtAmount") VALUES
('40000000-0000-0000-0000-000000000001','30000000-0000-0000-0000-000000000001','LAK',8500000,9000000),
('40000000-0000-0000-0000-000000000002','30000000-0000-0000-0000-000000000002','LAK',11500000,12000000),
('40000000-0000-0000-0000-000000000003','30000000-0000-0000-0000-000000000003','LAK',1050000,1250000),
('40000000-0000-0000-0000-000000000004','30000000-0000-0000-0000-000000000003','USD',49.90,59.90)
ON CONFLICT(id) DO NOTHING;

INSERT INTO product_images(id,"productId","variantId",url,"altText","sortOrder") VALUES
('50000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000001',NULL,
 'https://example.com/images/everyday-laptop.jpg','ຮູບແລັບທັອບສຳລັບໃຊ້ງານປະຈຳວັນ',0),
('50000000-0000-0000-0000-000000000002','20000000-0000-0000-0000-000000000002','30000000-0000-0000-0000-000000000003',
 'https://example.com/images/headphones-black.jpg','ຮູບຫູຟັງໄຮ້ສາຍສີດຳ',0)
ON CONFLICT(id) DO NOTHING;

INSERT INTO customers(id,"firstName","lastName",email,phone) VALUES
('60000000-0000-0000-0000-000000000001','ສົມພອນ','ໄຊຍະວົງ','demo.customer@example.com','+8562012345678')
ON CONFLICT(id) DO NOTHING;

INSERT INTO addresses(id,"customerId",label,"recipientName",phone,"addressLine1",village,district,province,"countryCode","isDefault") VALUES
('70000000-0000-0000-0000-000000000001','60000000-0000-0000-0000-000000000001',
 'ເຮືອນ','ສົມພອນ ໄຊຍະວົງ','+8562012345678','ເຮືອນເລກທີ 123 ຖະໜົນສາມແສນໄທ','ບ້ານສີສະຫວາດ','ເມືອງຈັນທະບູລີ','ນະຄອນຫຼວງວຽງຈັນ','LA',true)
ON CONFLICT(id) DO NOTHING;

COMMIT;

SELECT * FROM ecommerce.catalog_browser ORDER BY "productName","variantName",currency;
