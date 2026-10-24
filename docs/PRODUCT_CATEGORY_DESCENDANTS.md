# Products — includeDescendants (22 ຕຸລາ 2026)

## Contract ສຳລັບ Frontend

GraphQL ໃຊ້ `products(input: LoadProductDto)` ແລະ response `{items,total,page,limit}`.
ອັບເດດ contract ວັນທີ 25 ຕຸລາ 2026: `_id`, DTO ແລະ ActiveStatus; ເບິ່ງ `ID_DTO_MIGRATION.md`.
ເພີ່ມ `includeDescendants: Boolean = false` ເທົ່ານັ້ນ; ບໍ່ຍ້າຍ Product, ບໍ່ປ່ຽນ UUID/table/schema.

| Filter                                   | ຜົນ                                            |
| ---------------------------------------- | ---------------------------------------------- |
| categoryId + ບໍ່ສົ່ງ flag / false / null | ສະເພາະໝວດທີ່ເລືອກ                              |
| categoryId + true                        | ໝວດທີ່ເລືອກ + ລູກຫຼານທຸກລະດັບ                  |
| ບໍ່ມີ categoryId                         | ທຸກໝວດ; flag ບໍ່ມີຜົນ                          |
| ໝວດບໍ່ມີສິນຄ້າ / UUID ບໍ່ພົບ             | `items: []`, `total: 0`; ບໍ່ fallback ໄປທຸກໝວດ |

```graphql
query Products($input: LoadProductDto) {
  products(input: $input) {
    total
    page
    limit
    items {
      _id
      categoryId
      name
      slug
    }
  }
}
```

Variables (ປ່ຽນ `categoryId` ເປັນ UUID ຈິງຂອງໝວດແມ່):

```json
{
  "input": {
    "categoryId": "<UUID ໝວດແມ່>",
    "includeDescendants": true,
    "currency": "LAK",
    "page": 1,
    "limit": 12,
    "isActive": "active"
  }
}
```

`keyword`, currency ແລະ pagination ໃຊ້ຮ່ວມກັນໄດ້.
Backend ກຳນົດ subtree/keyword ກ່ອນ count ແລະ pagination; `total` ບໍ່ແມ່ນ `items.length`.
ໃຊ້ `createdAt DESC, _id DESC` ໃນ TypeORM ແລະ SQL ເພື່ອລຳດັບຄົງທີ່ເມື່ອ createdAt ເທົ່າກັນ.
Request ໜຶ່ງອາດມີ SQL count/data/hydration ຫຼາຍ statement ໄດ້ ແຕ່ບໍ່ query ແຍກຕາມ Parent/Category.

## ການອັບເດດ Flutter

ໃນ `lib/features/product/data/datasources/product_remote_data_source.dart`, ຕື່ມ field ນີ້ໃນ filter
ຫຼັງຈາກ backend ທີ່ run ຈິງຮອງຮັບແລ້ວ:

```dart
if (filter.categoryId != null) ...{
  'categoryId': filter.categoryId,
  'includeDescendants': true,
},
```

ຖ້າໃຊ້ແບບ exact/subtree ສະຫຼັບກັນໃນແອັບ ໃຫ້ເພີ່ມ flag ໃນ ProductFilter/provider key ດ້ວຍ.
ປ່ຽນ Category/keyword ໃຫ້ reset page=1, ບໍ່ໂຫຼດລູກເທື່ອລະ parent ຫຼືຄັດສິນຄ້າຈາກຊື່.
Admin ບໍ່ຈຳເປັນປ່ຽນ ເພາະ default=false.

## Active policy ແລະ cycle safety

- `isActive: active/inactive/all` ຄວບຄຸມ **Product.isActive**, ບໍ່ແມ່ນ Category.isActive.
- Subtree ຍັງຂ້າມຜ່ານໝວດ inactive ແລະລວມ product active ໃນໝວດນັ້ນຄື exact query ເດີມ.
  ຖ້າຕ້ອງການໃຫ້ inactive ancestor ປິດ subtree ທັງໝົດ ຕ້ອງກຳນົດ policy ໃໝ່ແຍກຕ່າງຫາກ.
- Recursive CTE ເລືອກແຕ່ _id ແລະໃຊ້ UNION ເພື່ອຕັດຊ້ຳ; legacy cycle ຈະບໍ່ວົນບໍ່ຈົບ.
- UpdateCategory ປະຕິເສດ self-parent ແລະ parent ທີ່ເປັນລູກຫຼານຂອງຕົນເອງ.
- Cache key ລວມ normalized flag ແລະ filter; exact/subtree ບໍ່ປົນກັນ.
  Category/Product writes ຍັງ invalidate `catalog:*` ຕາມເດີມ.

ອ້າງອີງ: [PostgreSQL recursive queries / UNION cycle handling](https://www.postgresql.org/docs/15/queries-with.html),
[TypeORM QueryBuilder CTE](https://typeorm.io/docs/query-builder/select-query-builder/).

## Tests

```bash
npm run test:catalog
# Local PostgreSQL; CATALOG_TEST_DB_PORT ປ່ຽນໄດ້ຕາມເຄື່ອງ
CATALOG_TEST_DB_PORT=5436 npm run test:catalog:postgres
npm run build
```

PostgreSQL test ໃຊ້ `pg_temp.categories/products` ໃນ connection/transaction ຂອງ test ເທົ່ານັ້ນ
ແລະ rollback ທຸກຄັ້ງ; ບໍ່ insert/update/delete ຂໍ້ມູນ ecommerce ເດີມ ແລະບໍ່ seed.
Unit tests ກວດ query construction/cache/schema; PostgreSQL tests ກວດ execution/count/paging ຈິງ.

## Deployment

Build ຢ່າງດຽວບໍ່ອັບເດດ server ທີ່ run ຢູ່.
Restart local backend ຫຼື rebuild/recreate backend service ຕາມ workflow ຂອງໂປຣເຈັກ.
ກວດ GraphQL introspection ວ່າ LoadProductDto ມີ includeDescendants ກ່ອນໃຫ້ frontend ສົ່ງ field.
ໃຊ້ Bruno `26 Products Include Descendants` ທົດສອບ UUID ຂອງ root/child/leaf ທີ່ມີຈິງ.

## ຜົນກວດ 22 ຕຸລາ 2026

- `npm run test:catalog`: 9/9 ຜ່ານ.
- PostgreSQL regression: 10 subtests ແລະ parent test ຜ່ານທັງໝົດ (11/11 ຕາມ Node runner).
- `npm run build`: ຜ່ານ; Prettier ຂອງ source/tests ທີ່ແກ້ໃນງານນີ້ຜ່ານ.
- ເປີດ preview backend ແຍກທີ່ `http://localhost:3099/api-gateway` ເພື່ອທົດສອບ source ໃໝ່.
  ບໍ່ restart/rebuild Docker ທີ່ຜູ້ໃຊ້ກຳລັງໃຊ້.
- Runtime schema ຂອງ preview ມີ includeDescendants default=false; ຄ່າ string `"true"` ຖືກປະຕິເສດ.
- ທົດສອບ public GraphQL ກັບ database ຈິງດ້ວຍ read-only query:

| ໝວດ                                                | includeDescendants | total             |
| -------------------------------------------------- | ------------------ | ----------------- |
| ຄອມພິວເຕີ (`97185773-0c7f-419d-a8c9-53a9064e027b`) | false              | 0                 |
| ໝວດດຽວກັນ                                          | true               | 1                 |
| ໝວດດຽວກັນ, page=2 / limit=1                        | true               | total=1, items=[] |

Product ທີ່ໄດ້ແມ່ນ `ແລັບທັອບສຳລັບໃຊ້ງານປະຈຳວັນ`
ໃນໝວດລູກ `e06440c7-b8e6-4db9-b3ca-1a1011a285f7` ພ້ອມ Variant/ລາຄາ LAK ຈາກ DB.
Laptop ທີ່ຜູກກັບໝວດເຄື່ອງໃຊ້ໄຟຟ້າອື່ນຈະບໍ່ຖືກລວມ ເຖິງຊື່ຈະມີຄຳ laptop ກໍ່ຕາມ.

ຂະນະກວດ preview ຄັ້ງທຳອິດ Docker 3001 ຍັງເປັນເວີຊັນເກົ່າ.
ຕໍ່ມາໄດ້ deploy ຕາມລາຍງານດ້ານລຸ່ມແລ້ວ. Preview 3099 ບໍ່ແມ່ນ production deployment
ແລະບໍ່ໄດ້ທົດສອບ UI Flutter end-to-end ໃນງານ backend ນີ້.

## Docker 3001 — deployed ແລ້ວ (22 ຕຸລາ 2026)

- ອັບເດດສະເພາະ backend service ດ້ວຍ:

```bash
docker compose --profile full build backend
docker compose --profile full up -d --no-deps --no-build backend
```

- Endpoint ທີ່ໃຊ້ຈິງ: `http://localhost:3001/api-gateway`.
- Runtime introspection ພົບ `includeDescendants` ແລະ default=false.
- ທົດສອບ GraphQL ຈາກ 3001: exact computer=0, subtree computer=1 ພ້ອມ variants/prices;
  page=2/limit=1 ໄດ້ total=1/items=[] ຖືກຕ້ອງ.
- CORS OPTIONS ຜ່ານ HTTP 204.
- ຈຳນວນກ່ອນ/ຫຼັງ deploy ຄືເກົ່າ: Categories=21, Products=6.
- PostgreSQL/Redis container ເປັນຕົວເກົ່າ ແລະ startedAt ບໍ່ປ່ຽນ; ບໍ່ reset volume, seed ຫຼື run migration.
- Unit 9/9 ແລະ PostgreSQL runner 11/11 ຜ່ານຊ້ຳກ່ອນ deploy.
- ບໍ່ແກ້ Flutter ໃນງານ deploy ນີ້; frontend ສາມາດເພີ່ມ flag ຕາມ contract ໄດ້ແລ້ວ.

Local rollback image: `millionx-ecommerce-backend:before-descendants-20261022`
ເປັນ filesystem snapshot ຂອງ container ເກົ່າ ເພາະ original image ID ຖືກລ້າງກ່ອນໜ້ານີ້.
Snapshot ບໍ່ລວມ DB/Redis/uploads bind volume ຫຼື runtime secrets; compose ຈ່າຍ env/mount ຕາມເດີມ.

ຂໍ້ຄວນຕິດຕາມ: npm audit ລະຫວ່າງ production image build ລາຍງານ 33 vulnerabilities
(11 moderate, 21 high, 1 critical). ຍັງບໍ່ໄດ້ triage ຫຼື upgrade dependencies ໃນງານ includeDescendants;
ຄວນກວດແຍກກ່ອນໃຊ້ production ທີ່ເປີດສາທາລະນະ. ບໍ່ໄດ້ run audit fix --force.
