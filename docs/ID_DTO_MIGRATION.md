# MillionX: `_id` and DTO contract migration — 2026-10-25

This is a breaking **GraphQL client contract** update for the entire MillionX backend.
The existing NestJS / TypeORM / PostgreSQL architecture and data are retained.
It is not a database reset, a seed run, or a new UUID generation operation.

## Primary identifiers

All entity models, repositories and GraphQL entity outputs use `_id`:

- Category, Product, ProductVariant, ProductPrice, ProductImage.
- Customer, CustomerAccount, CustomerSocialAccount, CustomerAddress.
- Staff/User and Zone already used `_id` and keep their existing values.

Every update DTO also uses `_id`, including nested variants, prices and images in
`UpdateProductDto`. Send the existing `_id` to update a record; omit it only when adding
a new nested record. Update your frontend types, form serialization and Apollo cache identity
(`keyFields: ['_id']`) together. For Flutter, parse `json['_id']` into the model identifier.
Frontend model variables may still be called `id` internally if their JSON mapping is explicit.

Foreign-reference names **do not change**: `parentId`, `categoryId`, `productId`, `variantId`,
`customerId`, `accountId`, `addressId`, and `deleteImageIds`. Their values reference `_id`
in the application, and the existing UUID columns in SQL. No leading underscore is added to them.

### PostgreSQL / Navicat

The subsequent physical-column migration uses `_id` in PostgreSQL too:

```ts
@PrimaryGeneratedColumn('uuid')
_id: string;
```

Initially the TypeScript `_id` property mapped to SQL `id`; the separate migration
`20261025_primary_keys_to_underscore_id.sql` now renames those nine SQL columns to `_id`.
Staff and Zone already used `_id`. UUID values, data, FK/index identities and relationships
are preserved; `synchronize` stays disabled. Current SQL scripts now use `_id` directly.
See [physical-column migration](SQL_PRIMARY_KEY_MIGRATION.md) for backup, rollout and rollback.

```sql
SELECT _id, name, "categoryId" FROM ecommerce.products;
```

JWT identity claims intentionally retain `id` so existing signed access/refresh tokens stay
compatible. Third-party provider responses (for example Facebook's `id`) are also not renamed.
Those are wire protocols, not MillionX entity fields.

## List requests

| Operation    | Old argument / type           | New argument / type      |
| ------------ | ----------------------------- | ------------------------ |
| `categories` | `filter: CategoryFilterInput` | `input: LoadCategoryDto` |
| `products`   | `filter: ProductFilterInput`  | `input: LoadProductDto`  |
| `customers`  | `filter: CustomerFilterInput` | `input: LoadCustomerDto` |
| `product`    | scalar argument `id`          | scalar argument `_id`    |

Operation names and page responses remain `categories`, `products`, `customers` and
`{items,total,page,limit}`. This avoids unrelated endpoint and response-wrapper changes.
The backend-default-style DTO naming does not require renaming `categories` to `loadCategory`.
All remaining GraphQL input types ending in `Input` now end in `Dto`.

### Authentication DTOs

| Old                        | New                      |
| -------------------------- | ------------------------ |
| `LoginInput`               | `LoginDto`               |
| `RefreshTokenInput`        | `RefreshTokenDto`        |
| `RegisterCustomerInput`    | `RegisterCustomerDto`    |
| `CustomerLoginInput`       | `CustomerLoginDto`       |
| `SocialLoginCustomerInput` | `SocialLoginCustomerDto` |

### Catalog/customer mutation DTOs

Replace the `Input` suffix with `Dto` for: `CreateCategory`, `UpdateCategory`,
`CreateProduct`, `CreateProductBundle`, `CreateProductVariant`, `SetProductPrice`,
`AddProductImage`, `UpdateProduct`, `UpdateProductVariant`, `UpdateProductPrice`,
`UpdateProductBundleImage`, `UpdateProductImage`, `DeleteProductImage`, `ProductBundleVariant`,
`ProductBundlePrice`, `ProductBundleImage`, `UpdateCustomerProfile`, `CreateCustomerAddress`,
and `UpdateCustomerAddress`. Zone DTO names do not change.

Both `createProduct` (base product) and `createProductBundle` (transactional bundle) remain.
This migration does not merge or remove product APIs.

## Status filters

`includeInactive` was removed from category/product list inputs. Use `isActive: ActiveStatus`:

| Requested rows | Old category/product list filter             | New list input       |
| -------------- | -------------------------------------------- | -------------------- |
| Active only    | `isActive: true` or `includeInactive: false` | `isActive: active`   |
| Inactive only  | Category `isActive: false`                   | `isActive: inactive` |
| All            | `includeInactive: true`                      | `isActive: all`      |

Category/Product default to `active`; Admin Customer list defaults to `all`, preserving
its previous default behavior. `LoadCustomerDto.accountIsActive` also uses
`active`, `inactive`, or `all`, defaulting to `all`.
JSON variables send these enum values as strings, e.g. `"isActive": "active"`.
Inline GraphQL literals use `isActive: active` without quotes.

This change applies to **list filters only**. Entity outputs and update inputs for
catalog/customer `isActive` remain Boolean (`true` / `false`), as do database values.
Do not write the filter sentinel `all` into database entity status fields.

## Examples for frontend

```graphql
query Categories($input: LoadCategoryDto) {
  categories(input: $input) {
    items {
      _id
      parentId
      name
      slug
      isActive
    }
    total
    page
    limit
  }
}
```

```json
{ "input": { "page": 1, "limit": 20, "isActive": "active", "rootOnly": false } }
```

```graphql
query Products($input: LoadProductDto) {
  products(input: $input) {
    items {
      _id
      categoryId
      name
      slug
      variants {
        _id
        sku
        attributesJson
        prices {
          _id
          currency
          amount
        }
      }
      images {
        _id
        variantId
        url
        altText
        sortOrder
      }
    }
    total
    page
    limit
  }
}
```

```json
{
  "input": {
    "categoryId": "<existing-category-uuid>",
    "includeDescendants": true,
    "page": 1,
    "limit": 20,
    "isActive": "active"
  }
}
```

`parentId`, `rootOnly`, `fetchAll`, `keyword`, pagination and `includeDescendants` behavior
are preserved. A parent with `includeDescendants: true` can have more than 20 total products.

```graphql
mutation UpdateProduct($input: UpdateProductDto!) {
  updateProduct(input: $input) {
    _id
    name
    variants {
      _id
      sku
    }
    images {
      _id
      url
    }
  }
}
```

```json
{
  "input": {
    "_id": "<existing-product-uuid>",
    "name": "Updated product",
    "isActive": true,
    "variants": [
      {
        "_id": "<existing-variant-uuid>",
        "sku": "EXISTING-SKU",
        "prices": [{ "_id": "<existing-price-uuid>", "currency": "LAK", "amount": 100000 }]
      }
    ]
  }
}
```

```graphql
mutation Login($input: LoginDto!) {
  login(input: $input) {
    _id
    username
    role
    token
    refreshToken
  }
}
```

## Rollout and verification

1. Update frontend GraphQL documents, variables (`filter` → `input`), JSON parsing, nested IDs,
   client cache identity and generated types together. Clear/reset the frontend's old entity cache.
2. Use the updated Bruno collection; reopen it if the editor retains stale drafts.
3. Build and restart the backend in coordination with frontend deployment.
4. Catalog cache keys are versioned `catalog:v2:*` so old cached objects containing `id` are
   never read as `_id` objects. Existing write invalidation still matches `catalog:*`.
5. Do not run database reset/seed scripts. Existing databases need the separate physical-column
   migration documented in `SQL_PRIMARY_KEY_MIGRATION.md` before starting the latest entities.

```sh
npm run build
npm run test:contract
npm run test:catalog
npm run test:catalog:postgres
TEST_API_URL=http://localhost:3098 REDIS_HOST=127.0.0.1 REDIS_HOST_PORT=6399 REDIS_PORT=6399 npm run test:integration
```

The preview at port 3098 was used with isolated test Redis, not the Redis instance serving
Docker port 3001. Integration tests clean up only the temporary records they created.
The earlier API-only task did not rebuild Docker port 3001; see `SQL_PRIMARY_KEY_MIGRATION.md`
for the subsequent physical-column migration and its deployment status.
The existing UI was not modified or browser-tested; coordinate its migration before rollout.

## Verification results — 2026-10-25

- `npm run build`: passed.
- `npm run test:contract`: 10/10 passed, including all 11 entity PK mappings and
  static validation of all 27 Bruno GraphQL documents against the generated schema.
- `npm run test:catalog`: 9/9 passed.
- `npm run test:catalog:postgres`: 11/11 passed (temporary tables only).
- Integration against the rebuilt local preview: 6/6 passed, covering staff/customer login,
  refresh-token isolation, category CRUD/cycle protection, product bundle create/update/rollback,
  customer profile/address/admin listing, and REST/GraphQL rate-limit metadata.
- Read-only live API check: all 21 categories still return 20 direct products each (420 total),
  using `_id`; legacy `id`/`filter` query fields and Boolean list-status values are rejected.
- Isolated Redis outage probe: category/product responses, including nested `_id` fields,
  remain identical when the test Redis stops; PostgreSQL fallback works. Production Redis
  and the existing Docker backend were not stopped or restarted.
- Before/after row counts **and full-row hashes matched in all 11 application tables** after
  integration cleanup: no original rows, UUIDs, credentials or catalog content changed.
- Temporary preview process and disposable Redis container were stopped after testing.

Data counts after cleanup: 21 categories, 420 products, 425 variants, 429 price records,
8 product images, 20 customers, 20 customer accounts, 15 social-account links, 5 addresses,
2 staff users and 4 zones. These are preserved counts, not new inserts from this migration.
