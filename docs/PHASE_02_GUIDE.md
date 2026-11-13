# Phase 2 — Shopping Guide

> 13 ພະຈິກ 2026: ຈັດຕັ້ງປະຕິບັດ Phase 2 (Shopping) ຄົບຖ້ວນ: Carts, Cart Items, Checkout Sessions, Wishlists, Wishlist Items.

Phase 2 ຮອງຮັບລະບົບກະຕ່າສິນຄ້າ (Member cart ແລະ Guest cart), ການຮວມກະຕ່າ (Merge Guest Cart), ການຄຳນວນລາຄາ/ພາສີ/ຄ່າສົ່ງຕອນ Checkout ພ້ອມ Price Snapshot ແລະ Expiry, ແລະລະບົບສິນຄ້າທີ່ມັກ (Wishlist CRUD).

---

## ຕາຕະລາງ Database (Schema: `ecommerce`)

| ຕາຕະລາງ                       | ໜ້າທີ່                                                         | Constraints ຫຼັກ                                                                                                          |
| ----------------------------- | -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `ecommerce.carts`             | ກະຕ່າສິນຄ້າຂອງ Member (`customerId`) ຫຼື Guest (`sessionId`)   | `_id` UUID PK, `uq_customer_active_cart` (active member cart unique), `uq_session_active_cart` (active guest cart unique) |
| `ecommerce.cart_items`        | ລາຍການສິນຄ້າໃນກະຕ່າ                                            | `_id` UUID PK, `cartId` FK, `variantId` FK, `quantity > 0`, `UNIQUE (cartId, variantId)`                                  |
| `ecommerce.checkout_sessions` | Session ການສັ່ງຊື້ ພ້ອມ snapshot ລາຄາ ແລະ ວັນໝົດອາຍຸ (30 ນາທີ) | `_id` UUID PK, `cartId` FK, `subtotal >= 0`, `status IN ('open', 'completed', 'expired', 'abandoned')`                    |
| `ecommerce.wishlists`         | ລາຍການສິນຄ້າທີ່ມັກຂອງ Customer                                 | `_id` UUID PK, `customerId` UNIQUE FK                                                                                     |
| `ecommerce.wishlist_items`    | ສິນຄ້າໃນ Wishlist                                              | `_id` UUID PK, `wishlistId` FK, `productId` FK, `UNIQUE (wishlistId, productId)`                                          |

Migration Script: `database/migrations/20261113_phase2_shopping.sql`  
Init Script: `database/init/03_shopping.sql`

---

## GraphQL Operations

Endpoint: `http://localhost:3001/api-gateway`

### 1. ກະຕ່າສິນຄ້າ (Cart)

#### ອ່ານກະຕ່າສິນຄ້າ (`myCart`)

ຮອງຮັບທັງ Member (ສົ່ງ Customer Token ໃນ Header) ແລະ Guest (ສົ່ງ `sessionId`):

```graphql
query MyCart($sessionId: String) {
  myCart(sessionId: $sessionId) {
    _id
    customerId
    sessionId
    isActive
    totalItems
    subtotal
    currency
    items {
      _id
      cartId
      variantId
      quantity
      sku
      productName
      variantName
      imageUrl
      unitPrice
      compareAtPrice
      lineTotal
    }
  }
}
```

#### ເພີ່ມສິນຄ້າເຂົ້າກະຕ່າ (`addToCart`)

```graphql
mutation AddToCart($input: AddToCartDto!) {
  addToCart(input: $input) {
    _id
    totalItems
    subtotal
    items {
      _id
      variantId
      quantity
      unitPrice
      lineTotal
    }
  }
}
```

Variables:

```json
{
  "input": {
    "variantId": "00000000-0000-0000-0000-000000000000",
    "quantity": 2,
    "sessionId": "guest-session-123"
  }
}
```

#### ແກ້ໄຂຈຳນວນສິນຄ້າໃນກະຕ່າ (`updateCartItem`)

```graphql
mutation UpdateCartItem($input: UpdateCartItemDto!) {
  updateCartItem(input: $input) {
    _id
    totalItems
    subtotal
    items {
      _id
      quantity
      lineTotal
    }
  }
}
```

#### ລຶບສິນຄ້າອອກຈາກກະຕ່າ (`removeCartItem`)

```graphql
mutation RemoveCartItem($input: RemoveCartItemDto!) {
  removeCartItem(input: $input) {
    _id
    totalItems
    subtotal
    items {
      _id
      productName
    }
  }
}
```

#### ຮວມກະຕ່າ Guest ເຂົ້າ Member (`mergeGuestCart`)

ຕອນ Guest Login ສຳເລັດ, ໃຫ້ເອີ້ນ mutation ນີ້ພ້ອມ `sessionId`:

```graphql
mutation MergeGuestCart($input: MergeGuestCartDto!) {
  mergeGuestCart(input: $input) {
    _id
    customerId
    totalItems
    subtotal
  }
}
```

ລະບົບຈະຮວມສິນຄ້າທັງໝົດພາຍໃນ transaction ດຽວ, ບວກ quantity ຖ້າ variant ຊ້ຳກັນ, ແລະປິດ active status ຂອງ guest cart (`isActive = false`, `mergedIntoCartId = memberCart._id`).

---

### 2. Checkout Session

#### ສ້າງ Checkout Session (`createCheckoutSession`)

```graphql
mutation CreateCheckoutSession($input: CreateCheckoutSessionDto) {
  createCheckoutSession(input: $input) {
    _id
    cartId
    subtotal
    discountAmount
    shippingAmount
    taxAmount
    total
    currency
    status
    expiresAt
    priceSnapshot {
      variantId
      sku
      productName
      variantName
      quantity
      unitPrice
      compareAtPrice
      currency
      subtotal
    }
  }
}
```

Variables:

```json
{
  "input": {
    "shippingAmount": "10000.00",
    "taxAmount": "0.00",
    "discountAmount": "0.00"
  }
}
```

- ຄຳນວນລາຄາລ່າສຸດຄືນໃໝ່ຈາກ `product_prices` ທີ່ active
- ສ້າງ `priceSnapshot` ເກັບຂໍ້ມູນລາຄາ ແລະ ສິນຄ້າແບບ immutable
- ຕັ້ງວັນໝົດອາຍຸ `expiresAt` ອັດຕະໂນມັດ 30 ນາທີ

#### ອ່ານ Checkout Session (`checkoutSession`)

```graphql
query GetCheckoutSession($_id: String!) {
  checkoutSession(_id: $_id) {
    _id
    total
    status
    expiresAt
    priceSnapshot {
      sku
      unitPrice
      quantity
      subtotal
    }
  }
}
```

---

### 3. ສິນຄ້າທີ່ມັກ (Wishlist)

#### ອ່ານ Wishlist (`myWishlist`)

```graphql
query MyWishlist {
  myWishlist {
    _id
    customerId
    items {
      _id
      productId
      productName
      productSlug
      brand
      imageUrl
      minPrice
      currency
      addedAt
    }
  }
}
```

#### ເພີ່ມເຂົ້າ Wishlist (`addToWishlist`)

```graphql
mutation AddToWishlist($input: AddToWishlistDto!) {
  addToWishlist(input: $input) {
    _id
    items {
      _id
      productId
      productName
    }
  }
}
```

#### ລຶບອອກຈາກ Wishlist (`removeFromWishlist`)

```graphql
mutation RemoveFromWishlist($input: RemoveFromWishlistDto!) {
  removeFromWishlist(input: $input) {
    _id
    items {
      _id
      productId
    }
  }
}
```

---

## ການທົດສອບ (Testing)

```bash
# Contract tests (Schema & DTO verification)
npm run test:contract

# Business logic & Domain validations
npm run test:shopping

# Bruno API requests (Requests 01–35)
npm run test:bruno
```
