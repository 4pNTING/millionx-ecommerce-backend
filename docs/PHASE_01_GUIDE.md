# Phase 1 — Foundation Guide

Phase 1 ປະກອບດ້ວຍ Category, Product, Customer profile, Customer login ແລະ Address. Primary key ຂອງຕາຕະລາງ E-commerce ໃຊ້ UUID.

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

```graphql
mutation CreateProduct($categoryId: String!) {
  createProduct(
    input: {
      categoryId: $categoryId
      name: "ແລັບທັອບ MillionX Pro"
      slug: "millionx-laptop-pro"
      description: "ແລັບທັອບສຳລັບວຽກຫ້ອງການ"
      brand: "MillionX"
    }
  ) {
    id
    name
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
  customerLogin(input: $input) {
    customerId
    email
    token
  }
}
```

Customer Profile/Address API ໃຊ້ `customerId` ຈາກ JWT ແລະບໍ່ຮັບ `customerId` ຈາກ client.

## Bruno flow

ເປີດ `api-client/bruno`, ເລືອກ `Local` ແລະ run `01` ຫາ `13`. Collection ຈະເກັບ Staff token, Customer token, Category ID, Product ID, Variant ID ແລະ Address ID ໃຫ້ອັດຕະໂນມັດ.

## ກວດ database

Run `database/verify/phase1_verify.sql`. ຜົນ `phase1EcommerceTableCount` ຕ້ອງເທົ່າກັບ `10`.

## ສ່ວນທີ່ຍັງບໍ່ມີໃນ Phase 1

Inventory, Cart, Order, Payment, Promotion, Shipping ແລະ Notification ຈະເພີ່ມໃນ Phase ຕໍ່ໄປ.
