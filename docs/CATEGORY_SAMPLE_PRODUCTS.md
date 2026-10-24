# Category sample products: 20 direct products per category

This is opt-in demonstration data, not genuine inventory or real commercial prices.
It is persisted in PostgreSQL and returned by the normal backend, not a frontend fallback.

Run from the backend directory using the `.env` for the database serving the intended backend:

```sh
node --env-file=.env scripts/top-up-category-products.js --dry-run
node --test test/catalog/category-products-topup.test.js
node --env-file=.env scripts/top-up-category-products.js --apply
```

- Default mode is read-only dry-run; only `--apply` inserts rows.
- Counts products linked **directly** to each category ID, including inactive products.
- Every existing category is included, including categories with the same name and inactive categories.
- Categories with 20 or more products are left alone. Nothing is deleted or overwritten.
- New products are active and clearly marked `ຕົວຢ່າງ`, brand `MillionX Demo`.
- Each new product has one UUID v4 variant, JSON attributes and one active LAK price.
- `compareAtAmount` is greater than `amount`. No fake image URLs or images are inserted.
- Original category, product, variant, price and image rows are checked for changes before commit.
- All inserts run in one transaction with short-lived catalog write locks; failure rolls back the batch.
- Staff/customer credentials, authentication, categories and schema are not changed.
- The output includes a batch UUID. Inserted product slugs start with `mx-demo20-<batch UUID>-`;
  variant SKUs start with `MX-DEMO20-<batch UUID>-`. Retain the report for exact identification.
- Do not run `npm run seed` for this operation: the general seed has unrelated account changes.

After a successful apply, invalidate only `catalog:*` in the Redis instance used by that backend.
The script deliberately does not guess a Redis endpoint or clear authentication/rate-limit keys.
No Docker image rebuild is needed for database-only inserts.

Frontend: use `products(input: {categoryId: "...", includeDescendants: false, page: 1, limit: 20, isActive: active})`
to see the 20 direct products. With `includeDescendants: true`, a parent can correctly have more
than 20 results because child-category products are included. Pagination still applies.

Re-run dry-run to verify that every category now needs zero additional rows.

## Applied on 2026-10-23

Verified against `http://localhost:3001/api-gateway` and its native PostgreSQL database
`millionx_ecommerce` on port 5432 (not the separate Docker database on port 5436).
Added 414 products, 414 variants and 414 LAK prices; all 21 categories now have 20 direct
products, for 420 products in total. Existing catalog rows were unchanged.

Live API verification passed for all 21 categories: page 1 returns 12 products, page 2 returns
8, with no repeated IDs. All 414 new products return one variant with one LAK price.
The computer category returns 60 products with descendants included. Repeat dry-run would add zero.
Deleted 5 matching `catalog:products:*` cache entries in the Redis instance used by port 3001.
Browser UI was not checked. Refresh the storefront to request the new data.

One pre-existing variant returns no price from the public API; it was preserved, not repaired:
product `98e5f99c-8afb-41af-b3b3-be8b76d54400`, variant `04e6b31a-17fc-4fcb-83af-7b5beb89fcb3`.
See `CATEGORY_SAMPLE_PRODUCTS_20261023.json` for the batch ID, per-category counts and checks.
