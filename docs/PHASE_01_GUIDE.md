# Phase 1 — Foundation Guide

Phase 1 ປະກອບດ້ວຍ Category, Product, Customer profile, Customer login ແລະ Address. Primary key ຂອງຕາຕະລາງ E-commerce ໃຊ້ RFC 4122 UUID v4.

ສຳລັບ database ເກົ່າ ໃຫ້ run `database/migrations/20260903_normalize_phase1_uuid_v4.sql` ໜຶ່ງຄັ້ງ. Migration ຈະສ້າງ UUID v4 ໃໝ່ສະເພາະແຖວທີ່ ID ຜິດມາດຕະຖານ ແລະ update Foreign Key ທີ່ເຊື່ອມກັນໃຫ້ອັດຕະໂນມັດ.

## ຕາຕະລາງ

| ສ່ວນ             | ຕາຕະລາງ                       | ໜ້າທີ່                                                  |
| ---------------- | ----------------------------- | ------------------------------------------------------- |
| Staff/Auth       | `ecommerce.users`             | Login account ຂອງ Staff/Admin                           |
| Zone             | `ecommerce.zones`             | ຂໍ້ມູນເຂດທີ່ໃຊ້ໃນລະບົບ                                  |
| Category         | `ecommerce.categories`        | ໝວດໝູ່ຫຼາຍລະດັບ; `parentId` ເປັນ FK ກັບ `categories.id` |
| Product          | `ecommerce.products`          | ຂໍ້ມູນຫຼັກຂອງສິນຄ້າ                                     |
| Variant          | `ecommerce.product_variants`  | SKU, Barcode ແລະຕົວເລືອກເຊັ່ນ RAM/ສີ                    |
| Price            | `ecommerce.product_prices`    | ລາຄາຕາມ Variant ແລະ currency                            |
| Image            | `ecommerce.product_images`    | ຮູບຂອງ Product ຫຼື Variant                              |
| Customer         | `ecommerce.customers`         | Profile ແລະຂໍ້ມູນຕິດຕໍ່; ບໍ່ເກັບ password               |
| Customer Account | `ecommerce.customer_accounts` | Login account ແລະ password hash                         |
| Address          | `ecommerce.addresses`         | ທີ່ຢູ່ຈັດສົ່ງ ແລະ default address                       |

`ecommerce.users` ໃຊ້ສຳລັບ Staff/Admin ເທົ່ານັ້ນ; Customer login ໃຊ້ `ecommerce.customer_accounts`.

## ເລີ່ມ Backend

```bash
npm run infra:up
npm run seed
npm run start:dev
```

GraphQL: `http://localhost:3001/api-gateway`

ຖ້າ Backend run ຜ່ານ Docker, PostgreSQL ທີ່ Backend ໃຊ້ຢູ່ໃນ container ແລະ Navicat ຕ້ອງເຊື່ອມ `localhost:5436` (ຫຼືຄ່າ `DB_HOST_PORT`). `localhost:5432` ແມ່ນ PostgreSQL ທີ່ run ໂດຍກົງໃນ Mac ແລະເປັນຄົນລະ instance; ຂໍ້ມູນຈຶ່ງອາດບໍ່ຄືກັນ.

## Reset ແລະ seed ຜ່ານ Navicat

1. ຢຸດ Backend.
2. Run `database/reset/phase1_reset.sql`.
3. Run `database/init/00_auth_zone.sql`.
4. Run `database/init/01_ecommerce_foundation.sql`.
5. ກັບໄປ terminal ແລ້ວ run `npm run seed`.
6. Refresh schema `ecommerce` ໃນ Navicat.

Reset ຈະລຶບຂໍ້ມູນ Phase 1 ທັງໝົດ ລວມທັງ Staff/Admin ແລະ Zone. ຕ້ອງ backup ຂໍ້ມູນສຳຄັນກ່ອນ reset.

## Staff/Admin login

ໃຊ້ username/password ຈາກ `SEED_ADMIN_USERNAME` ແລະ `SEED_ADMIN_PASSWORD` ໃນ `.env`:

```graphql
mutation Login($input: LoginInput!) {
  login(input: $input) {
    username
    role
    token
    refreshToken
  }
}
```

Category/Product mutation ຕ້ອງສົ່ງ header:

```text
Authorization: Bearer STAFF_TOKEN
```

## Category and Product query

```graphql
query CommerceData {
  categories(filter: { page: 1, limit: 10, includeInactive: true }) {
    total
    page
    limit
    items {
      id
      parentId
      name
      slug
      sortOrder
      isActive
    }
  }

  products(filter: { currency: "LAK", page: 1, limit: 20 }) {
    total
    items {
      id
      name
      variants {
        sku
        name
        attributesJson
        prices {
          currency
          amount
          compareAtAmount
        }
      }
    }
  }
}
```

### Category pagination contract for Frontend

`categories` accepts one `filter` object. The response is a page object, not an array.

```graphql
query Categories($filter: CategoryFilterInput) {
  categories(filter: $filter) {
    items {
      id
      parentId
      name
      slug
      description
      sortOrder
      isActive
      createdAt
      updatedAt
    }
    total
    page
    limit
  }
}
```

Example variables:

```json
{
  "filter": {
    "parentId": null,
    "keyword": "phone",
    "isActive": true,
    "includeInactive": false,
    "rootOnly": false,
    "fetchAll": false,
    "page": 1,
    "limit": 10
  }
}
```

Frontend must read rows from `data.categories.items` and calculate the page count with
`Math.ceil(data.categories.total / data.categories.limit)`.

Category filter behavior:

- Omit `parentId` (or send `null`) to search and paginate categories from every hierarchy level.
- Send `parentId` to list only the direct children of that category.
- Send `rootOnly: true` to list only root categories.
- Send `fetchAll: true` to disable `skip/take` and load the complete flat category tree in one SQL
  request. The Frontend can build nested `children` from `id` and `parentId`; `page` and `limit` are
  ignored in this mode.

## ສ້າງ Category/Product data

หน้า Create Product ຄວນໃຊ້ `createProductBundle` ເພື່ອສ້າງ Product, Variant, Price ແລະ Image ໃນ PostgreSQL transaction ດຽວ. ຖ້າຂັ້ນຕອນໃດຜິດ ຂໍ້ມູນທັງໝົດຈະ rollback.

```graphql
mutation CreateProductBundle($input: CreateProductBundleInput!) {
  createProductBundle(input: $input) {
    id
    name
    variants {
      id
      sku
      prices {
        currency
        amount
        compareAtAmount
      }
    }
    images {
      id
      url
    }
  }
}
```

`compareAtAmount` ແມ່ນລາຄາກ່ອນຫຼຸດ ແລະຕ້ອງຫຼາຍກວ່າ ຫຼືເທົ່າກັບ `amount`.

### Product image mutation

- `addProductImage` ເພີ່ມແຖວຮູບໃໝ່.
- `updateProductImage` ແກ້ຮູບເດີມດ້ວຍ `imageId`; ຮອງຮັບ `url`, `altText`, `sortOrder` ແລະ `variantId`.
- `deleteProductImage` ລຶບແຖວຮູບຕາມ `imageId`. API ບໍ່ລຶບໄຟລ໌ຈາກ Upload storage.
- ການສົ່ງ `variantId: null` ໃນ `updateProductImage` ຈະປ່ຽນຮູບໃຫ້ເປັນຮູບຂອງ Product ຫຼັກ.

```graphql
mutation UpdateProductImage($input: UpdateProductImageInput!) {
  updateProductImage(input: $input) {
    id
    images {
      id
      variantId
      url
      altText
      sortOrder
    }
  }
}

mutation DeleteProductImage($input: DeleteProductImageInput!) {
  deleteProductImage(input: $input) {
    id
    images {
      id
    }
  }
}
```

```graphql
mutation CreateProductVariant($productId: String!) {
  createProductVariant(
    input: {
      productId: $productId
      sku: "MX-LAPTOP-16-512-BLK"
      name: "RAM 16GB / SSD 512GB / ສີດຳ"
      attributesJson: "{\"ram\":\"16GB\",\"storage\":\"512GB\",\"color\":\"black\"}"
    }
  ) {
    id
    sku
    attributesJson
  }
}
```

`attributesJson` ຈະຖືກແປງເປັນ PostgreSQL `jsonb`. Entity ຕ້ອງໃຊ້ `@Column('jsonb', { default: {} })`.

### Update Product ແບບຊຸດ

`updateProduct` ຮອງຮັບການແກ້ Product, Variant/Attributes, Price ແລະ Image/Alternative text
ໃນ request ດຽວ. ຂໍ້ມູນທັງໝົດຖືກບັນທຶກໃນ transaction ດຽວ; ຖ້າສ່ວນໃດຜິດຈະ rollback ທັງຊຸດ.
ການສົ່ງ `id` ຂອງ Variant, Price ຫຼື Image ຈະແກ້ແຖວເດີມ ໂດຍບໍ່ສ້າງແຖວຊ້ຳ.
ໃຊ້ `deleteImageIds` ເພື່ອລຶບຫຼາຍຮູບໃນ transaction ດຽວ. ຖ້າສ້າງ Variant ໃໝ່
ແລະຮູບຂອງ Variant ພ້ອມກັນ ໃຫ້ສົ່ງ `variantSku` ໃນ Image; Backend ຈະສ້າງ Variant
ແລ້ວຜູກ UUID ໃຫ້ຮູບອັດຕະໂນມັດ.

```graphql
mutation UpdateProduct($input: UpdateProductInput!) {
  updateProduct(input: $input) {
    id
    variants {
      id
      attributesJson
    }
    images {
      id
      altText
    }
  }
}
```

```json
{
  "input": {
    "id": "PRODUCT_UUID",
    "variants": [
      {
        "id": "VARIANT_UUID",
        "sku": "MX-LAPTOP-16-512-BLK",
        "attributesJson": "{\"ram\":\"16GB\",\"storage\":\"512GB\"}"
      }
    ],
    "images": [
      {
        "id": "IMAGE_UUID",
        "altText": "ຮູບດ້ານໜ້າຂອງແລັບທັອບ"
      },
      {
        "variantSku": "MX-LAPTOP-16-512-BLK",
        "url": "https://example.com/images/millionx-black.jpg",
        "altText": "ຮູບຕົວເລືອກສີດຳ",
        "sortOrder": 1
      }
    ],
    "deleteImageIds": ["OLD_IMAGE_UUID"]
  }
}
```

## Customer register/login

```graphql
mutation RegisterCustomer {
  registerCustomer(
    input: {
      firstName: "ສົມພອນ"
      lastName: "ໄຊຍະວົງ"
      email: "customer@example.com"
      phone: "+8562012345678"
      password: "Customer123!"
    }
  ) {
    accountId
    customerId
    token
  }
}
```

```graphql
mutation CustomerLogin($input: CustomerLoginInput!) {
  loginCustomer(input: $input) {
    customerId
    email
    token
  }
}
```

Customer Profile/Address API ໃຊ້ `customerId` ຈາກ JWT ແລະບໍ່ຮັບ `customerId` ຈາກ client.

## Login/Register Rate Limit

Rate Limit ຖືກໃຊ້ກັບ GraphQL `login`, `loginCustomer`, `registerCustomer` ແລະ REST
`POST /api/auth/login`:

| Operation          | Default limit   | Counter dimensions  |
| ------------------ | --------------- | ------------------- |
| `login`            | 5 / 60 ວິນາທີ   | IP + Staff username |
| `loginCustomer`    | 5 / 60 ວິນາທີ   | IP + email/phone    |
| `registerCustomer` | 3 / 3600 ວິນາທີ | IP + email/phone    |

Counter ໃຊ້ Redis atomic increment + TTL. ຖ້າ Redis ໃຊ້ບໍ່ໄດ້ Backend ຈະໃຊ້ in-memory
counter ເພື່ອບໍ່ເປີດຊ່ອງໃຫ້ brute force. Username, email, phone ແລະ IP ຖືກ hash
ກ່ອນສ້າງ Redis key.

Frontend ບໍ່ຕ້ອງປ່ຽນ mutation. ເມື່ອເກີນ limit ໃຫ້ສະແດງ GraphQL error message
`Too many ... attempts. Try again in N seconds` ແລະ disable ປຸ່ມ submit ຕາມເວລາທີ່ລະບຸ.

## Bruno flow

ເປີດ `api-client/bruno`, ເລືອກ `Local` ແລະ run `01` ຫາ `18`. Collection ຈະເກັບ Staff token, Customer token, Category ID, Product ID, Variant ID, Product Image ID ແລະ Address ID ໃຫ້ອັດຕະໂນມັດ. Request `19` ໃຊ້ທົດສອບ Rate Limit ແຍກຕ່າງຫາກ.

## Automated integration test

```bash
docker compose --profile full up -d --build
npm run test:integration
```

Test ຄອບຄຸມ Staff/Customer Auth, Refresh token, Category, Product bundle transaction,
Variant/Price/Image, Customer Profile/Address, Admin Customer List, rollback ແລະ Rate Limit.
Test ບໍ່ອະນຸຍາດໃຫ້ run ໃນ production ແລະ cleanup ສະເພາະ UUID ທີ່ມັນສ້າງ.

## Automated Redis outage test

```bash
npm run test:redis-fallback
```

Test ຈະຢຸດ Redis container ຊົ່ວຄາວ ແລ້ວກວດວ່າ Category/Product query
ຍັງອ່ານຈາກ PostgreSQL ໄດ້ ແລະ Auth Rate Limit ໃຊ້ in-memory counter.
ຫຼັງທົດສອບ Test ຈະເປີດ Redis, restart Backend ແລະກວດ Redis cache ອີກຄັ້ງ.
ຄຳສັ່ງນີ້ປະຕິເສດ Production/Remote URL ແລະບໍ່ປ່ຽນ application rows.

## ກວດ database

```bash
npm run db:verify:phase1
```

ຫຼື run `database/verify/phase1_verify.sql` ໃນ Navicat. ຜົນທຸກ check ຕ້ອງເປັນ `PASS`.
Verification gate ນີ້ເປັນ read-only ສຳລັບ application data ແລະ rollback temporary state
ທັງໝົດຫຼັງກວດສຳເລັດ. ຖ້າ check ໃດບໍ່ຜ່ານ SQL ຈະ raise exception.

## ສ່ວນທີ່ຍັງບໍ່ມີໃນ Phase 1

Inventory, Cart, Order, Payment, Promotion, Shipping ແລະ Notification ຈະເພີ່ມໃນ Phase ຕໍ່ໄປ.
