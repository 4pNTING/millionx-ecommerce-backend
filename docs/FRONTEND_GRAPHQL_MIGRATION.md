# Frontend GraphQL Migration

> Latest contract (2026-10-25): see [ID/DTO migration](ID_DTO_MIGRATION.md) for
> `_id`, `input`, `...Dto`, and `ActiveStatus`. The Catalog-prefix mapping below remains valid;
> clients must apply the newer identifier/DTO changes too.

GraphQL API ແຍກ Category ແລະ Product ອອກຈາກຊື່ legacy `Catalog`. ການປ່ຽນນີ້ເປັນ breaking change: Frontend ຕ້ອງປ່ຽນ operation, response path ແລະ generated types ພ້ອມກັນ.

## Operation mapping

| Old GraphQL name         | New GraphQL name        |
| ------------------------ | ----------------------- |
| `catalogCategories`      | `categories`            |
| `catalogProducts`        | `products`              |
| `catalogProduct`         | `product`               |
| `createCatalogCategory`  | `createCategory`        |
| `updateCatalogCategory`  | `updateCategory`        |
| `createCatalogProduct`   | `createProduct`         |
| `updateCatalogProduct`   | `updateProduct`         |
| `createCatalogVariant`   | `createProductVariant`  |
| `setCatalogProductPrice` | `setProductPrice`       |
| `addCatalogProductImage` | `addProductImage`       |
| `customerLogin`          | `loginCustomer`         |
| `upsertCustomerProfile`  | `updateCustomerProfile` |

## Type and input mapping

| Old type/input              | New type/input             |
| --------------------------- | -------------------------- |
| `CatalogCategory`           | `Category`                 |
| `CatalogCategoryPage`       | `CategoryPage`             |
| `CatalogCategoryFilterDto`  | `LoadCategoryDto`          |
| `CreateCatalogCategoryDto`  | `CreateCategoryDto`        |
| `UpdateCatalogCategoryDto`  | `UpdateCategoryDto`        |
| `CatalogProduct`            | `Product`                  |
| `CatalogProductPage`        | `ProductPage`              |
| `CatalogProductFilterDto`   | `LoadProductDto`           |
| `CatalogVariant`            | `ProductVariant`           |
| `CatalogPrice`              | `ProductPrice`             |
| `CatalogImage`              | `ProductImage`             |
| `CreateCatalogProductDto`   | `CreateProductDto`         |
| `UpdateCatalogProductDto`   | `UpdateProductDto`         |
| `CreateCatalogVariantDto`   | `CreateProductVariantDto`  |
| `SetCatalogProductPriceDto` | `SetProductPriceDto`       |
| `AddCatalogProductImageDto` | `AddProductImageDto`       |
| `UpsertCustomerProfileDto`  | `UpdateCustomerProfileDto` |
| `CreateCustomerAddressDto`  | `CreateCustomerAddressDto` |
| `UpdateCustomerAddressDto`  | `UpdateCustomerAddressDto` |

## Category query

```graphql
query Categories($input: LoadCategoryDto) {
  categories(input: $input) {
    items {
      _id
      parentId
      name
      slug
      sortOrder
      isActive
    }
    total
    page
    limit
  }
}
```

Frontend response path:

```ts
const rows = response.data.categories.items;
const total = response.data.categories.total;
```

## Product query

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
        prices {
          currency
          amount
        }
      }
      images {
        _id
        url
      }
    }
    total
    page
    limit
  }
}
```

## Frontend update checklist

1. Replace every old operation and input name using the tables above.
2. Change response paths, for example `data.catalogProducts` to `data.products`.
3. Regenerate GraphQL types/hooks if the Frontend uses GraphQL Code Generator.
4. Delete generated cache/artifacts before regenerating so old `Catalog...` types do not remain.
5. Update mocks, tests and query cache keys that contain old operation names.
6. Restart the Frontend dev server after regeneration.

The endpoint and authentication header do not change:

```text
POST http://localhost:3001/api-gateway
Authorization: Bearer STAFF_TOKEN
```
