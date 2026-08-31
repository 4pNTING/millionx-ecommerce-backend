# MillionX E-commerce Development Plan

## Architecture decision

ເລີ່ມດ້ວຍ NestJS Modular Monolith, PostgreSQL schema `ecommerce`, TypeORM migration, GraphQL ແລະ Redis. ແຍກເປັນ Microservices ເມື່ອມີ deployment, scaling, team ownership ຫຼື security boundary ທີ່ຊັດເຈນ.

## Phase 1 — Foundation

ຕາຕະລາງ: users, zones, categories, products, product_variants, product_prices, product_images, customers, customer_accounts, addresses.

ວຽກຫຼັກ:

1. ໃຊ້ UUID ແລະປິດ TypeORM synchronize.
2. ສ້າງ SQL init/reset/verify ແລະ seed ພາສາລາວ.
3. ສ້າງ Category, Product ແລະ Customer Entity, Repository, Use Case ແລະ Resolver.
4. ແຍກ `ecommerce.users` ສຳລັບ Staff/Admin ຈາກ Customer account.
5. ຮອງຮັບ Customer register/login, profile ແລະ address.
6. ຮອງຮັບ Product Variant, `jsonb` attributes ແລະລາຄາຫຼາຍ currency.
7. ເພີ່ມ Redis cache ພ້ອມ database fallback.
8. ທົດສອບຜ່ານ Bruno, GraphQL ແລະ Navicat.

ຜ່ານເມື່ອ: 10 ຕາຕະລາງຄົບ, seed/login/category/product query ສຳເລັດ, category cycle ຖືກປ້ອງກັນ ແລະ Redis ລົ້ມແລ້ວ Category/Product ຍັງອ່ານໄດ້.

## Phase 2 — Shopping

ຕາຕະລາງ: carts, cart_items, checkout_sessions, wishlists, wishlist_items.

1. ຮອງຮັບ Member cart ແລະ Guest cart.
2. Merge Guest cart ຫຼັງ login ພາຍໃນ transaction.
3. Add/update/remove cart item.
4. Recalculate price, promotion, shipping ແລະ tax ຕອນ checkout.
5. ເກັບ pricing snapshot ແລະ expiry.
6. ເພີ່ມ Wishlist CRUD.
7. ທົດສອບ concurrent update ແລະ active-cart uniqueness.

## Phase 3 — Order + Inventory

ຕາຕະລາງ: orders, order_items, order_status_history, inventory, inventory_movements, inventory_reservations.

1. ສ້າງ Order snapshot ຈາກ Checkout.
2. ສ້າງ order number ແຍກຈາກ UUID.
3. Lock inventory ດ້ວຍ `SELECT ... FOR UPDATE`.
4. Commit Order, Items, Reservation ແລະ Movement ໃນ transaction ດຽວ.
5. ສ້າງ reservation expiry worker.
6. ບັນທຶກ status history.
7. ທົດສອບ concurrent checkout ເພື່ອປ້ອງກັນ overselling.

## Phase 4 — Payment + Delivery

ຕາຕະລາງ: payments, refunds, webhook_events, shipping_methods, shipments, shipment_items.

1. ສ້າງ Payment Provider Adapter.
2. ບັງຄັບ idempotency ຕາມ provider.
3. ກວດ webhook signature ແລະ persist ກ່ອນ process.
4. Commit/release inventory ຕາມຜົນ Payment.
5. ປ້ອງກັນ Refund ເກີນຍອດ Payment.
6. ຮອງຮັບ partial shipment ແລະ tracking.
7. ທົດສອບ duplicate webhook/refund.

## Phase 5 — Growth + Control

ຕາຕະລາງ: promotions, promotion_rules, promotion_redemptions, outbox_events, audit_logs, idempotency_keys.

1. ສ້າງ deterministic promotion engine.
2. Lock/check promotion usage limit ໃນ transaction.
3. ເກັບ rule snapshot ໃນ redemption/order.
4. ສ້າງ transactional outbox ພ້ອມ retry.
5. ສ້າງ idempotency middleware ແລະ consumers.
6. Audit ການປ່ຽນ Price, Stock, Promotion, Refund ແລະ Admin action.
7. ກຳນົດ retention, monitoring, alert ແລະ backup/restore drill.

## MVP release gate

- Phase 1–4 ຜ່ານຄົບ.
- ບໍ່ມີ duplicate payment, stock movement ຫຼື order.
- ບໍ່ມີ overselling.
- Checkout/Payment/Webhook ຮອງຮັບ retry.
- Migration, rollback ແລະ backup/restore ຜ່ານ.
- ມີ log, metric ແລະ alert ສຳລັບວຽກສຳຄັນ.

## Microservices extraction gate

ແຍກ service ເມື່ອມີຢ່າງໜ້ອຍໜຶ່ງເຫດຜົນ: team ownership, independent deployment, scaling ທີ່ແຕກຕ່າງ ຫຼື security boundary. ຫຼັງແຍກຫ້າມໃຊ້ Foreign Key ຂ້າມ service; ໃຊ້ UUID, gRPC ແລະ Outbox events.
