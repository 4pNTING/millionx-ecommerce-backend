# MillionX E-commerce Backend

Backend ສຳລັບ MillionX E-commerce ສ້າງດ້ວຍ NestJS ແລະ ໂຄງສ້າງແບບດຽວກັບ `backend-default`. ລະບົບແຍກ Staff/Admin ອອກຈາກ Customer ຢ່າງຊັດເຈນ.

## Technology stack

- Node.js 20 ແລະ TypeScript 5
- NestJS 10
- GraphQL + Apollo
- gRPC ສຳລັບ Auth ແລະ Zone
- TypeORM 0.3.28 (`synchronize: false`)
- PostgreSQL 15: database `millionx_ecommerce`
- Redis 7 ສຳລັບ cache ແລະ Auth Rate Limit; ຖ້າ Redis ລົ້ມ Rate Limit ຈະ fallback ໄປ in-memory counter
- Docker Compose ສຳລັບ infrastructure

## Database Phase 1

`ecommerce` ມີ 10 ຕາຕະລາງ Foundation:

- `users`
- `zones`
- `categories`
- `products`
- `product_variants`
- `product_prices`
- `product_images`
- `customers`
- `customer_accounts`
- `addresses`

`users` ໃຊ້ສະເພາະ Staff/Admin. Customer login ໃຊ້ `customer_accounts` ທີ່ເຊື່ອມກັບ `customers.id` ຜ່ານ `customerId`.

ID ທຸກຕາຕະລາງເປັນ RFC 4122 UUID v4. ຖ້າ database ເກົ່າມີ UUID ທີ່ PostgreSQL ຮັບໄດ້ແຕ່ API validation ບໍ່ຮັບ, ໃຫ້ run `database/migrations/20260903_normalize_phase1_uuid_v4.sql`. Migration ຈະປ່ຽນສະເພາະ ID ທີ່ບໍ່ຖືກມາດຕະຖານ ແລະຮັກສາ Foreign Key ທັງໝົດ.

ຖ້າ database ເກົ່າຍັງມີ `public.users` ແລະ `public.zones`, ໃຫ້ run `database/migrations/20260823_move_auth_zone_to_ecommerce.sql`. Migration ຈະຍ້າຍ table, enum type ແລະຂໍ້ມູນເດີມໂດຍບໍ່ລຶບຂໍ້ມູນ.

## Entity ແລະ PostgreSQL schema

Entity ໃຊ້ສະເພາະຊື່ຕາຕະລາງ:

```ts
@Entity('categories')
export class CategoryEntity {}
```

TypeORM connection ກຳນົດ `search_path=ecommerce,public` ໄວ້ສ່ວນກາງ. ຕາຕະລາງຂອງແອັບທັງໝົດຢູ່ໃນ `ecommerce`; `public` ສຳລັບ PostgreSQL extension ແລະ function ທົ່ວໄປ.

ຄ່າທີ່ TypeScript ສະທ້ອນເປັນ `Object` ຕ້ອງລະບຸ PostgreSQL type ໃຫ້ຊັດເຈນ:

```ts
@Column('jsonb', { default: {} })
attributes: Record<string, unknown>;
```

## ເລີ່ມຕົ້ນ

```bash
cp .env.example .env
npm ci --legacy-peer-deps
npm run infra:up
npm run seed
npm run start:dev
```

ແກ້ `DB_PASSWORD`, `JWT_SECRET`, `SEED_ADMIN_PASSWORD` ແລະ `SEED_CUSTOMER_PASSWORD` ໃນ `.env` ກ່ອນໃຊ້ງານ.

`JWT_SECRET` ຕ້ອງມີຢ່າງໜ້ອຍ 32 ຕົວອັກສອນ. Docker Compose ຈະບໍ່ສ້າງ Backend container ຖ້າຄ່ານີ້ຫາຍໄປ ແລະ NestJS ຈະລາຍງານຊື່ environment variable ທີ່ຂາດຢ່າງຊັດເຈນ.

- GraphQL: `http://localhost:3001/api-gateway`
- gRPC: `localhost:9898`
- ໃນ development ຄວນເປີດ Backend ພຽງ 1 instance ເພື່ອບໍ່ໃຫ້ port `3001` ຫຼື `9898` ຊ້ຳກັນ.

## Reset Phase 1

ຄຳສັ່ງ reset ຈະລຶບ schema `ecommerce` ລວມທັງ `users` ແລະ `zones`. ໃຊ້ສະເພາະ development ຫຼື test ແລະຕ້ອງ backup ກ່ອນໃຊ້ກັບຂໍ້ມູນສຳຄັນ.

ໃນ Navicat ຫຼື pgAdmin ໃຫ້ເປີດແລະ run ຕາມລຳດັບ:

1. `database/reset/phase1_reset.sql`
2. `database/init/00_auth_zone.sql`
3. `database/init/01_ecommerce_foundation.sql`

ຫຼັງຈາກນັ້ນ:

```bash
npm run seed
```

ຫ້າມ reset database production ໂດຍບໍ່ມີ backup.

## Seed data

`npm run seed` ສ້າງຂໍ້ມູນ development:

- Admin ຈາກ `SEED_ADMIN_USERNAME`/`SEED_ADMIN_PASSWORD`
- Customer ຈາກ `SEED_CUSTOMER_EMAIL`/`SEED_CUSTOMER_PASSWORD`
- Zone ພາສາລາວ 3 ລາຍການ
- Category ພາສາລາວ 10 ລາຍການ
- Product 2, Variant 3, Price 4, Image 2
- Customer account ແລະ Address ພາສາລາວ

Password ຖືກ hash ດ້ວຍ bcrypt ກ່ອນບັນທຶກ.

## Bruno

ເປີດ `api-client/bruno` ເປັນ Bruno Collection, ເລືອກ environment `Local` ແລະ run request `01` ຫາ `18` ຕາມລຳດັບ. Request `19` ສຳລັບທົດສອບ Rate Limit. ອ່ານລາຍລະອຽດໃນ `api-client/bruno/README.md`.

## Automated integration test

ເມື່ອ Backend, PostgreSQL ແລະ Redis ເຮັດວຽກແລ້ວ:

```bash
npm run test:integration
```

Test ຈະໃຊ້ API ຈິງ, ສ້າງຂໍ້ມູນຊົ່ວຄາວທີ່ມີຊື່ບໍ່ຊ້ຳ ແລະ cleanup ສະເພາະ UUID
ທີ່ Test ສ້າງ. ຄຳສັ່ງຈະປະຕິເສດການ run ເມື່ອ `NODE_ENV=production`.

## Automated Redis outage test

ເມື່ອ Full Docker stack ເຮັດວຽກແລ້ວ:

```bash
npm run test:redis-fallback
```

Test ຈະຢຸດ Redis ຊົ່ວຄາວ, ກວດວ່າ Category/Product ຍັງອ່ານຈາກ PostgreSQL,
ກວດ in-memory Auth Rate Limit, ແລ້ວເປີດ Redis ພ້ອມ restart Backend ໃຫ້ອັດຕະໂນມັດ.
Test ນີ້ໃຊ້ໄດ້ສະເພາະ Local ແລະບໍ່ແກ້ໄຂ application rows ໃນ database.
ລາຍລະອຽດຢູ່ `test/fallback/README.md`.

## Auth Rate Limit

- Staff/Admin login: 5 ຄັ້ງຕໍ່ 60 ວິນາທີ.
- Customer login: 5 ຄັ້ງຕໍ່ 60 ວິນາທີ.
- Customer register: 3 ຄັ້ງຕໍ່ 3600 ວິນາທີ.
- ນັບທັງ IP ແລະ username/email/phone ແບບ SHA-256; ບໍ່ເກັບ identifier ດິບໃນ Redis key.
- Login ສຳເລັດຈະ reset counter ຂອງ account ແຕ່ຍັງຮັກສາ IP counter ເພື່ອປ້ອງກັນ abuse.

ປັບຄ່າໄດ້ໃນ `.env` ດ້ວຍ `AUTH_LOGIN_RATE_LIMIT_MAX`,
`AUTH_LOGIN_RATE_LIMIT_WINDOW_SECONDS`, `AUTH_REGISTER_RATE_LIMIT_MAX` ແລະ
`AUTH_REGISTER_RATE_LIMIT_WINDOW_SECONDS`.

## Code formatting

Project ໃຊ້ Prettier ສຳລັບຈັດຮູບແບບ TypeScript, JavaScript, JSON, Markdown ແລະ YAML ໃຫ້ເປັນມາດຕະຖານດຽວກັນ.

```bash
# ຈັດ code ທັງ project
npm run format

# ກວດ code ໂດຍບໍ່ແກ້ file
npm run format:check
```

VS Code ຈະແນະນຳ extension `Prettier - Code formatter` ແລະ format file ອັດຕະໂນມັດເມື່ອ Save. ກ່ອນ commit ຄວນ run `npm run format:check` ແລະ `npm run build`.

## ກວດ Phase 1

```bash
npm run db:verify:phase1
```

ຫຼື run `database/verify/phase1_verify.sql` ໃນ Navicat. ທຸກແຖວຕ້ອງເປັນ `PASS`.
Script ຈະກວດ 10 tables, UUID v4, Primary/Foreign Key, Index, Category cycle, orphan rows,
business constraints, bcrypt password, Admin account ແລະ Customer account linkage. ຖ້າຂໍ້ໃດ
ບໍ່ຜ່ານ ຄຳສັ່ງຈະຈົບດ້ວຍ exit code `1`.

## ເອກະສານ

- `docs/ARCHITECTURE.md` — ໂຄງສ້າງແລະກົດຂອງ code
- `docs/PHASE_01_GUIDE.md` — API ແລະວິທີທົດສອບ Phase 1
- `docs/DEVELOPMENT_PLAN.md` — ແຜນ Phase ຕໍ່ໄປ
