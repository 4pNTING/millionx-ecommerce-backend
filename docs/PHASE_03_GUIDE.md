# Phase 3 — Order & Inventory Guide

> 17–18 ພະຈິກ 2026: ຈັດຕັ້ງປະຕິບັດ Phase 3 (Order & Inventory) ຄົບຖ້ວນ: Orders, Order Items, Order Status History, Inventory, Inventory Movements, Inventory Reservations.
> ປັບປຸງໂຄງສ້າງ Repositories ເປັນແບບ Modular CRUD Subfolders ຕາມມາດຕະຖານດຽວກັບ `src/infrastructure/repositories/zone/`.

Phase 3 ຮອງຮັບລະບົບການສັ່ງຊື້ (Order Processing), ການຈອງແລະຕັດສະຕັອກສິນຄ້າ (Pessimistic Locking `SELECT ... FOR UPDATE`), ການປ້ອງກັນການຂາຍເກີນ (Anti-Overselling), ລະບົບປົດລັອກສະຕັອກອັດຕະໂນມັດ (Reservation Expiry Worker), ແລະການຈັດການປະຫວັດສະຖານະຄຳສັ່ງຊື້ (Audit Trail).

---

## ໂຄງສ້າງ Repositories ແບບ Modular CRUD (ຕາມແບບ `zone`)

ໂຄງສ້າງ Repository ຂອງ Phase 3 ຖືກແຍກເປັນ Subfolder ສະເພາະແຕ່ລະ Operation ຕາມຮູບແບບດຽວກັບ `src/infrastructure/repositories/zone/` ໂດຍແຕ່ລະໂຟນເດີປະກອບມີ `<operation>.action.ts` (Business logic & SQL execution) ແລະ `<operation>.validation.ts` (Data validation):

### 1. Order Repository (`src/infrastructure/repositories/order/`)

- `createOrder/`
  - `createOrder.action.ts`
  - `createOrder.validation.ts`
- `loadOrders/`
  - `loadOrders.action.ts`
  - `loadOrders.validation.ts`
- `loadOrderById/`
  - `loadOrderById.action.ts`
  - `loadOrderById.validation.ts`
- `findOrderByOrderNumber/`
  - `findOrderByOrderNumber.action.ts`
  - `findOrderByOrderNumber.validation.ts`
- `cancelOrder/`
  - `cancelOrder.action.ts`
  - `cancelOrder.validation.ts`
- `updateOrderStatus/`
  - `updateOrderStatus.action.ts`
  - `updateOrderStatus.validation.ts`
- `order.repository.ts` (Facade delegating to individual actions)
- `order-details.mapper.ts` (Mapping database rows to Domain model)

### 2. Inventory Repository (`src/infrastructure/repositories/inventory/`)

- `getInventory/`
  - `getInventory.action.ts`
  - `getInventory.validation.ts`
- `adjustStock/`
  - `adjustStock.action.ts`
  - `adjustStock.validation.ts`
- `reserveStock/`
  - `reserveStock.action.ts`
  - `reserveStock.validation.ts`
- `releaseOrderReservations/`
  - `releaseOrderReservations.action.ts`
  - `releaseOrderReservations.validation.ts`
- `releaseExpiredReservations/`
  - `releaseExpiredReservations.action.ts`
  - `releaseExpiredReservations.validation.ts`
- `inventory.repository.ts` (Facade delegating to individual actions)
- `inventory-details.mapper.ts` (Mapping database rows to Domain model)

---

## ຕາຕະລາງ Database (Schema: `ecommerce`)

| ຕາຕະລາງ                            | ໜ້າທີ່                              | Constraints ຫຼັກ                                                                                                                                         |
| :--------------------------------- | :---------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ecommerce.orders`                 | ຂໍ້ມູນຄຳສັ່ງຊື້ຫຼັກ                 | `_id` UUID PK, `orderNumber` VARCHAR UNIQUE, `customerId` FK, `total >= 0`, `status IN ('pending', 'confirmed', 'processing', 'completed', 'cancelled')` |
| `ecommerce.order_items`            | ລາຍການສິນຄ້າໃນແຕ່ລະ Order           | `_id` UUID PK, `orderId` FK, `variantId` FK, `quantity > 0`, `UNIQUE (orderId, variantId)`                                                               |
| `ecommerce.order_status_history`   | ປະຫວັດການປ່ຽນແປງສະຖານະ Order        | `_id` UUID PK, `orderId` FK, `toStatus` VARCHAR, `createdBy` VARCHAR                                                                                     |
| `ecommerce.inventory`              | ສະຕັອກສິນຄ້າຂອງແຕ່ລະ Variant        | `_id` UUID PK, `variantId` UNIQUE FK, `available = onHand - reserved`                                                                                    |
| `ecommerce.inventory_movements`    | ປະຫວັດການເຄື່ອນໄຫວສະຕັອກ            | `_id` UUID PK, `variantId` FK, `type IN ('inbound', 'outbound', 'reserved', 'released', 'adjustment')`                                                   |
| `ecommerce.inventory_reservations` | ການຈອງສະຕັອກຊົ່ວຄາວລະຫວ່າງລໍຖ້າຈ່າຍ | `_id` UUID PK, `orderId` FK, `variantId` FK, `status IN ('active', 'consumed', 'released', 'expired')`                                                   |

Migration Script: `database/migrations/20261117_phase3_order_inventory.sql`  
Init Script: `database/init/04_order_inventory.sql`

---

## GraphQL Operations

Endpoint: `http://localhost:3001/api-gateway`

### 1. ຄຳສັ່ງຊື້ (Orders)

#### ສ້າງ Order ຈາກ Checkout Session (`createOrder`)

Header: `Authorization: Bearer <customerToken>`

```graphql
mutation CreateOrder($input: CreateOrderDto!) {
  createOrder(input: $input) {
    _id
    orderNumber
    customerId
    status
    subtotal
    discountAmount
    shippingAmount
    taxAmount
    total
    currency
    shippingAddress {
      recipientName
      phone
      addressLine1
      city
      country
    }
    items {
      _id
      variantId
      sku
      productName
      quantity
      unitPrice
      subtotal
    }
    statusHistory {
      _id
      fromStatus
      toStatus
      note
      createdBy
    }
    createdAt
  }
}
```

Variables:

```json
{
  "input": {
    "checkoutSessionId": "<checkoutSessionId>",
    "shippingAddress": {
      "recipientName": "Somchai Vongsa",
      "phone": "02012345678",
      "addressLine1": "Lane Xang Avenue",
      "city": "Vientiane",
      "country": "Laos"
    },
    "notes": "Please deliver during business hours"
  }
}
```

#### ລາຍການຄຳສັ່ງຊື້ຂອງຂ້ອຍ (`myOrders`)

Header: `Authorization: Bearer <customerToken>`

```graphql
query MyOrders($input: LoadOrderDto) {
  myOrders(input: $input) {
    total
    page
    limit
    items {
      _id
      orderNumber
      status
      total
      currency
      createdAt
      items {
        sku
        productName
        quantity
        subtotal
      }
    }
  }
}
```

#### ເບິ່ງລາຍລະອຽດ Order ຕາມ ID (`order`)

Header: `Authorization: Bearer <customerToken>` ຫຼື `Authorization: Bearer <staffToken>`

```graphql
query Order($_id: String!) {
  order(_id: $_id) {
    _id
    orderNumber
    customerId
    status
    subtotal
    total
    currency
    shippingAddress {
      recipientName
      phone
      addressLine1
    }
    items {
      _id
      sku
      productName
      quantity
      unitPrice
      subtotal
    }
    statusHistory {
      fromStatus
      toStatus
      note
      createdBy
      createdAt
    }
  }
}
```

#### ເບິ່ງລາຍລະອຽດ Order ຕາມ Order Number (`orderByOrderNumber`)

Header: `Authorization: Bearer <customerToken>` ຫຼື `Authorization: Bearer <staffToken>`

```graphql
query OrderByOrderNumber($orderNumber: String!) {
  orderByOrderNumber(orderNumber: $orderNumber) {
    _id
    orderNumber
    customerId
    status
    subtotal
    total
    currency
    items {
      sku
      productName
      quantity
      unitPrice
      subtotal
    }
    statusHistory {
      fromStatus
      toStatus
      note
      createdBy
      createdAt
    }
  }
}
```

#### ຍົກເລີກ Order (`cancelOrder`)

Header: `Authorization: Bearer <customerToken>`

```graphql
mutation CancelOrder($input: CancelOrderDto!) {
  cancelOrder(input: $input) {
    _id
    orderNumber
    status
    statusHistory {
      fromStatus
      toStatus
      note
      createdBy
    }
  }
}
```

#### ອັບເດດສະຖານະ Order ໂດຍ Staff (`updateOrderStatus`)

Header: `Authorization: Bearer <staffToken>`

```graphql
mutation UpdateOrderStatus($input: UpdateOrderStatusDto!) {
  updateOrderStatus(input: $input) {
    _id
    orderNumber
    status
    statusHistory {
      fromStatus
      toStatus
      note
      createdBy
    }
  }
}
```

---

### 2. ສະຕັອກສິນຄ້າ (Inventory)

#### ກວດສອບສະຕັອກສິນຄ້າ (`inventory`)

```graphql
query Inventory($variantId: String!) {
  inventory(variantId: $variantId) {
    _id
    variantId
    onHand
    reserved
    available
    updatedAt
  }
}
```

#### ປັບປຸງສະຕັອກສິນຄ້າ (`adjustInventory`)

Header: `Authorization: Bearer <staffToken>`

```graphql
mutation AdjustInventory($input: AdjustStockDto!) {
  adjustInventory(input: $input) {
    _id
    variantId
    onHand
    reserved
    available
    updatedAt
  }
}
```

Variables:

```json
{
  "input": {
    "variantId": "<variantId>",
    "quantityDelta": 20,
    "type": "inbound",
    "referenceType": "purchase_order",
    "note": "Restocked batch 2026-11-17"
  }
}
```

#### ປົດລັອກສະຕັອກທີ່ໝົດອາຍຸ (`releaseExpiredReservations`)

Header: `Authorization: Bearer <staffToken>`

```graphql
mutation ReleaseExpiredReservations {
  releaseExpiredReservations
}
```

---

## ກົດລະບຽບທາງທຸລະກິດ & Concurrency Protection

1. **Pessimistic Lock (`SELECT ... FOR UPDATE`):**
   - ທຸກການຈອງສະຕັອກຕອນສ້າງ Order ຈະທຳການ Lock ແຖວ Inventory ຂອງ Variant ນັ້ນໆ ເພື່ອປ້ອງກັນ Race Condition.
   - ຫາກສິນຄ້າບໍ່ພຽງພໍ (`available < quantity`) ລະບົບຈະ Reject ທັນທີພ້ອມແຈ້ງເຕືອນ.
2. **Atomic All-or-Nothing Transaction:**
   - ການສ້າງ Order, Order Items, Inventory Reservation, Status History, ແລະການປິດ Checkout Session ຈະເກີດຂຶ້ນພາຍໃນ Database Transaction ດຽວກັນຢ່າງສົມບູນ.
3. **Automatic Reservation Release:**
   - ເມື່ອ Order ຖືກຍົກເລີກ (`cancelled`), ສະຕັອກທີ່ `reserved` ໄວ້ຈະຖືກປ່ອຍຄືນເປັນ `available` ທັນທີ.
   - ເມື່ອ Order ສຳເລັດ (`completed`), ສະຕັອກຈະຖືກຫັກອອກຈາກ `onHand` ຢ່າງຖາວອນ.

---

## ການທົດສອບ & Verification (Tests)

- **Unit & Logic Tests (`npm run test:order`):** ຜ່ານ 12/12 tests
  1. `CreateOrderValidation` validates customerId, checkoutSessionId, and shippingAddress
  2. `LoadOrdersValidation` validates customerId and paging bounds
  3. `CancelOrderValidation` and `UpdateOrderStatusValidation` validate IDs and statuses
  4. `AdjustStockValidation` validates UUID, quantityDelta and movement types
  5. `CreateOrderAction` creates order, reserves inventory, and marks session completed
  6. `CreateOrderAction` throws error if stock is insufficient
  7. `CancelOrderAction` releases reservations and sets status cancelled
  8. `UpdateOrderStatusAction` deducts onHand when completed
  9. `AdjustStockAction` increases or decreases onHand correctly
  10. `ReleaseExpiredReservationsAction` releases stale reservations and cancels pending order
  11. `FindOrderByOrderNumberValidation`, `ReserveStockValidation`, and `ReleaseOrderReservationsValidation` validate inputs
  12. `ReserveStockAction` and `ReleaseOrderReservationsAction` perform CRUD on reservations and inventory
- **All Automated Test Suites:**
  - `npm run test:order`: 12/12 ຜ່ານ
  - `npm run test:shopping`: 11/11 ຜ່ານ
  - `npm run test:contract`: 10/10 ຜ່ານ
  - `npm run test:catalog`: 9/9 ຜ່ານ
  - **ລວມທັງໝົດ 42 tests ຜ່ານ 100%**
- **Bruno API Collection:** 43/43 requests ຜ່ານ 100% (Requests 01–43)
