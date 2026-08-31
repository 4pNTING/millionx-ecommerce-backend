# MillionX Backend Architecture

ໂຄງການໃຊ້ແນວທາງ Domain + Use Cases + Infrastructure ແບບດຽວກັບ `backend-default`. Resolver ບໍ່ query TypeORM ໂດຍກົງ.

```text
src/
├── domain/
│   ├── models/
│   └── repositories/
├── usecases/
│   ├── auth/
│   ├── zone/
│   ├── category/
│   ├── product/
│   └── customer/
└── infrastructure/
    ├── cache/
    ├── common/
    ├── controllers/
    ├── entities/
    ├── repositories/
    │   ├── category/
    │   │   ├── createCategory/
    │   │   ├── loadCategories/
    │   │   ├── updateCategory/
    │   │   └── category.repository.ts
    │   ├── product/
    │   │   ├── createProduct/
    │   │   ├── createVariant/
    │   │   ├── loadProduct/
    │   │   ├── loadProducts/
    │   │   ├── setPrice/
    │   │   ├── updateProduct/
    │   │   ├── addImage/
    │   │   └── product.repository.ts
    │   ├── customer/
    │   ├── user/
    │   └── zone/
    ├── resolvers/
    │   ├── auth/
    │   ├── category/
    │   ├── product/
    │   ├── zone/
    │   └── customer/
    └── usecases-proxy/
        ├── category-usecases-proxy.module.ts
        └── product-usecases-proxy.module.ts
```

## Request flow

```text
GraphQL / HTTP Request
        ↓
Resolver / Controller + validation
        ↓
Usecase Proxy (Dependency Injection)
        ↓
Use Case
        ↓
Domain Repository Interface
        ↓
Database Repository
        ↓
TypeORM → PostgreSQL / Redis
```

## ໜ້າທີ່ຂອງແຕ່ລະ layer

- `domain/models`: persisted model, read model ແລະ request contract
- `domain/repositories`: interface ທີ່ Use Case ໃຊ້ໂດຍບໍ່ຮູ້ລາຍລະອຽດ database
- `usecases`: business action ໜຶ່ງວຽກຕໍ່ໜຶ່ງ class
- `infrastructure/entities`: TypeORM mapping ໜຶ່ງ Entity ຕໍ່ໜຶ່ງຕາຕະລາງ
- `infrastructure/repositories`: repository ຫຼັກເຮັດ orchestration, transaction ແລະ cache invalidation;
  ແຕ່ລະ operation ແຍກ `*.validation.ts` ສຳລັບ business/database validation
  ແລະ `*.action.ts` ສຳລັບ query ຫຼື persistence
- `infrastructure/resolvers`: GraphQL schema, DTO validation ແລະ authorization
- `infrastructure/usecases-proxy`: ປະກອບ Repository implementation ເຂົ້າກັບ Use Case

## Repository boundaries

- `DatabaseCategoryRepository` owns only category queries and category mutations.
- `DatabaseProductRepository` owns the Product aggregate: product, variant, price and image. These
  records are changed together inside product transactions, so they are not split into one
  repository per database table.
- Customer, User and Zone keep their own repositories.
- Category and Product also keep separate Domain Models, Use Cases, Resolvers and Usecase Proxy
  Modules. There is no combined `catalog.repository.ts`, `catalog.model.ts` or `CatalogResolver`.
- The public GraphQL contract uses feature names directly: `categories`, `products`, `product`,
  `Category`, `Product` and `ProductVariant`. Legacy `Catalog...` GraphQL names are not exposed.
- Do not create a repository that mixes unrelated aggregates, and do not create a repository only
  because a table exists. Repository boundaries follow business consistency and transaction
  boundaries.

## Entity rules

Entity ຕ້ອງອ່ານງ່າຍແລະ `implements` Domain Model:

```ts
import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';
import { ProductModel } from '../../domain/models/product.model';

@Entity('products')
export class ProductEntity implements ProductModel {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 200 })
  name: string;
}
```

ກົດສຳຄັນ:

1. Entity decorator ໃຊ້ສະເພາະຊື່ຕາຕະລາງ: `@Entity('products')`.
2. TypeORM connection ກຳນົດ `search_path=ecommerce,public` ສ່ວນກາງ.
3. Decorator ແລະ property ແຍກຄົນລະແຖວ.
4. ຄ່າ `Record`, object ຫຼື array ຕ້ອງລະບຸ database type ໃຫ້ຊັດເຈນ.
5. ຫ້າມໃຊ້ `synchronize: true`.

ຕົວຢ່າງ `jsonb` ທີ່ຖືກຕ້ອງ:

```ts
@Column('jsonb', { default: {} })
attributes: Record<string, unknown>;
```

ຖ້າຂຽນພຽງ `@Column({ default: {} })`, TypeORM ຈະເຫັນ TypeScript type ເປັນ `Object` ແລະ PostgreSQL ຈະເກີດ `DataTypeNotSupportedError`.

## Database boundaries

- `ecommerce.users`: Staff/Admin login; ແຍກຈາກ Customer account
- `ecommerce.zones`: Zone data
- `ecommerce.*`: Auth, Zone, Category, Product, Customer account ແລະ Address
- Customer password ຢູ່ `customer_accounts.passwordHash`; ບໍ່ຢູ່ `customers`
- `CustomerEntity` ບໍ່ມີ `authUserId`

## Customer naming

ຊື່ feature ໃຊ້ `customer` ໂດຍບໍ່ເພີ່ມ prefix:

- `CustomerEntity`
- `CustomerProfileModel`
- `ICustomerRepository`
- `DatabaseCustomerRepository`
- `CustomerResolver`
- `CustomerUsecasesProxyModule`

## ຂັ້ນຕອນເພີ່ມ feature ໃໝ່

1. ສ້າງ Domain Model ແລະ Repository Interface.
2. ສ້າງ Entity ແຍກຕາມຕາຕະລາງ.
3. ສ້າງ Repository implementation ໂດຍໃຫ້ repository ຫຼັກເອີ້ນ
   `Validation → Action`; ແຍກ operation ລະໂຟນເດີຕາມແບບ
   `createProduct/createProduct.validation.ts` ແລະ `createProduct.action.ts`.
4. ສ້າງ Use Case ແຍກຕາມ command/query.
5. Register ຜ່ານ Usecase Proxy Module.
6. ໃຫ້ Resolver/Controller ເອີ້ນ Use Case ເທົ່ານັ້ນ.
7. Register Entity ແລະ Repository ໃນ `RepositoriesModule`.
8. ສ້າງ SQL migration ແລະທົດສອບ rollback.
