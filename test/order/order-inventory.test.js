const assert = require('node:assert/strict');
const { test, describe } = require('node:test');

const {
  CreateOrderValidation,
} = require('../../src/infrastructure/repositories/order/createOrder/createOrder.validation');
const {
  LoadOrdersValidation,
} = require('../../src/infrastructure/repositories/order/loadOrders/loadOrders.validation');
const {
  CancelOrderValidation,
} = require('../../src/infrastructure/repositories/order/cancelOrder/cancelOrder.validation');
const {
  UpdateOrderStatusValidation,
} = require('../../src/infrastructure/repositories/order/updateOrderStatus/updateOrderStatus.validation');
const {
  GetInventoryValidation,
} = require('../../src/infrastructure/repositories/inventory/getInventory/getInventory.validation');
const {
  AdjustStockValidation,
} = require('../../src/infrastructure/repositories/inventory/adjustStock/adjustStock.validation');
const {
  FindOrderByOrderNumberValidation,
} = require('../../src/infrastructure/repositories/order/findOrderByOrderNumber/findOrderByOrderNumber.validation');
const {
  ReserveStockValidation,
} = require('../../src/infrastructure/repositories/inventory/reserveStock/reserveStock.validation');
const {
  ReleaseOrderReservationsValidation,
} = require('../../src/infrastructure/repositories/inventory/releaseOrderReservations/releaseOrderReservations.validation');

const {
  CreateOrderAction,
} = require('../../src/infrastructure/repositories/order/createOrder/createOrder.action');
const {
  CancelOrderAction,
} = require('../../src/infrastructure/repositories/order/cancelOrder/cancelOrder.action');
const {
  UpdateOrderStatusAction,
} = require('../../src/infrastructure/repositories/order/updateOrderStatus/updateOrderStatus.action');
const {
  FindOrderByOrderNumberAction,
} = require('../../src/infrastructure/repositories/order/findOrderByOrderNumber/findOrderByOrderNumber.action');
const {
  AdjustStockAction,
} = require('../../src/infrastructure/repositories/inventory/adjustStock/adjustStock.action');
const {
  ReserveStockAction,
} = require('../../src/infrastructure/repositories/inventory/reserveStock/reserveStock.action');
const {
  ReleaseOrderReservationsAction,
} = require('../../src/infrastructure/repositories/inventory/releaseOrderReservations/releaseOrderReservations.action');
const {
  ReleaseExpiredReservationsAction,
} = require('../../src/infrastructure/repositories/inventory/releaseExpiredReservations/releaseExpiredReservations.action');

describe('Phase 3 — Order & Inventory validations & business logic', () => {
  const customerId = 'a0000000-0000-4000-8000-000000000001';
  const checkoutSessionId = 'b0000000-0000-4000-8000-000000000002';
  const orderId = 'c0000000-0000-4000-8000-000000000003';
  const variantId = 'd0000000-0000-4000-8000-000000000004';
  const validAddress = {
    recipientName: 'Somchai Vongsa',
    phone: '02012345678',
    addressLine1: 'Lane Xang Avenue',
    city: 'Vientiane',
    country: 'Laos',
  };

  test('CreateOrderValidation validates customerId, checkoutSessionId, and shippingAddress', () => {
    const validator = new CreateOrderValidation();
    assert.throws(() => validator.execute(null), /Order input is required/);
    assert.throws(
      () => validator.execute({ customerId: 'invalid', checkoutSessionId, shippingAddress: validAddress }),
      /customerId must be a valid UUID/,
    );
    assert.throws(
      () => validator.execute({ customerId, checkoutSessionId: 'invalid', shippingAddress: validAddress }),
      /checkoutSessionId must be a valid UUID/,
    );
    assert.throws(
      () => validator.execute({ customerId, checkoutSessionId, shippingAddress: null }),
      /shippingAddress object is required/,
    );
    assert.throws(
      () =>
        validator.execute({
          customerId,
          checkoutSessionId,
          shippingAddress: { ...validAddress, recipientName: '' },
        }),
      /recipientName is required/,
    );
    assert.doesNotThrow(() =>
      validator.execute({ customerId, checkoutSessionId, shippingAddress: validAddress }),
    );
  });

  test('LoadOrdersValidation validates customerId and paging bounds', () => {
    const validator = new LoadOrdersValidation();
    assert.throws(() => validator.execute({ customerId: 'bad-uuid' }), /customerId must be a valid UUID/);
    assert.throws(() => validator.execute({ page: 0 }), /page must be an integer >= 1/);
    assert.throws(() => validator.execute({ limit: 101 }), /limit must be an integer between 1 and 100/);
    assert.doesNotThrow(() => validator.execute({ customerId, page: 1, limit: 20 }));
  });

  test('CancelOrderValidation and UpdateOrderStatusValidation validate IDs and statuses', () => {
    const cancelValidator = new CancelOrderValidation();
    assert.throws(() => cancelValidator.execute('invalid'), /orderId must be a valid UUID/);
    assert.doesNotThrow(() => cancelValidator.execute(orderId, customerId));

    const statusValidator = new UpdateOrderStatusValidation();
    assert.throws(() => statusValidator.execute(orderId, 'unknown_status'), /status must be one of/);
    assert.doesNotThrow(() => statusValidator.execute(orderId, 'processing'));
  });

  test('AdjustStockValidation validates UUID, quantityDelta and movement types', () => {
    const validator = new AdjustStockValidation();
    assert.throws(
      () => validator.execute({ variantId: 'invalid', quantityDelta: 5, type: 'inbound', referenceType: 'purchase_order' }),
      /variantId must be a valid UUID/,
    );
    assert.throws(
      () => validator.execute({ variantId, quantityDelta: 0, type: 'inbound', referenceType: 'purchase_order' }),
      /quantityDelta must be a non-zero integer/,
    );
    assert.throws(
      () => validator.execute({ variantId, quantityDelta: 5, type: 'invalid_type', referenceType: 'purchase_order' }),
      /type must be one of/,
    );
    assert.doesNotThrow(() =>
      validator.execute({ variantId, quantityDelta: 10, type: 'inbound', referenceType: 'purchase_order' }),
    );
  });

  test('CreateOrderAction creates order, reserves inventory, and marks session completed', async () => {
    const queries = [];
    const mockRunner = {
      manager: {
        query: async (sql, params) => {
          queries.push({ sql, params });
          if (sql.includes('FROM ecommerce.checkout_sessions')) {
            return [
              {
                _id: checkoutSessionId,
                cartId: 'e0000000-0000-4000-8000-000000000005',
                customerId,
                subtotal: '100.00',
                discountAmount: '0.00',
                shippingAmount: '10.00',
                taxAmount: '5.00',
                total: '115.00',
                currency: 'LAK',
                status: 'open',
                expiresAt: new Date(Date.now() + 600000),
                priceSnapshot: [
                  {
                    variantId,
                    sku: 'MX-TEST-001',
                    productName: 'Test Phone',
                    variantName: 'Black 128GB',
                    quantity: 2,
                    unitPrice: '50.00',
                    subtotal: '100.00',
                    currency: 'LAK',
                  },
                ],
              },
            ];
          }
          if (sql.includes('INSERT INTO ecommerce.orders')) {
            return [
              {
                _id: orderId,
                orderNumber: 'MX-20261117-123456',
                customerId,
                checkoutSessionId,
                subtotal: '100.00',
                discountAmount: '0.00',
                shippingAmount: '10.00',
                taxAmount: '5.00',
                total: '115.00',
                currency: 'LAK',
                status: 'pending',
                shippingAddress: validAddress,
                billingAddress: null,
                notes: null,
                createdAt: new Date(),
                updatedAt: new Date(),
              },
            ];
          }
          if (sql.includes('FROM ecommerce.inventory')) {
            return [
              {
                _id: 'f0000000-0000-4000-8000-000000000006',
                variantId,
                onHand: 10,
                reserved: 0,
                available: 10,
              },
            ];
          }
          if (sql.includes('FROM ecommerce.order_items')) {
            return [
              {
                _id: 'item-1',
                orderId,
                variantId,
                sku: 'MX-TEST-001',
                productName: 'Test Phone',
                variantName: 'Black 128GB',
                quantity: 2,
                unitPrice: '50.00',
                subtotal: '100.00',
                createdAt: new Date(),
              },
            ];
          }
          if (sql.includes('FROM ecommerce.order_status_history')) {
            return [
              {
                _id: 'hist-1',
                orderId,
                fromStatus: null,
                toStatus: 'pending',
                note: 'Order created',
                createdBy: 'customer',
                createdAt: new Date(),
              },
            ];
          }
          return [];
        },
      },
    };

    const action = new CreateOrderAction(mockRunner, { query: mockRunner.manager.query });
    const order = await action.execute({
      customerId,
      checkoutSessionId,
      shippingAddress: validAddress,
    });

    assert.equal(order._id, orderId);
    assert.equal(order.status, 'pending');
    assert.equal(order.items.length, 1);
    assert.equal(order.items[0].quantity, 2);

    // Verify inventory reservation was updated (reserved: 2, available: 8)
    const updateInv = queries.find((q) => q.sql.includes('UPDATE ecommerce.inventory'));
    assert.ok(updateInv);
    assert.equal(updateInv.params[0], 2); // newReserved
    assert.equal(updateInv.params[1], 8); // newAvailable

    // Verify checkout session completed
    assert.ok(queries.some((q) => q.sql.includes('UPDATE ecommerce.checkout_sessions')));
    // Verify cart deactivated
    assert.ok(queries.some((q) => q.sql.includes('UPDATE ecommerce.carts')));
  });

  test('CreateOrderAction throws error if stock is insufficient', async () => {
    const mockRunner = {
      manager: {
        query: async (sql) => {
          if (sql.includes('FROM ecommerce.checkout_sessions')) {
            return [
              {
                _id: checkoutSessionId,
                customerId,
                subtotal: '100.00',
                discountAmount: '0.00',
                shippingAmount: '0.00',
                taxAmount: '0.00',
                total: '100.00',
                currency: 'LAK',
                status: 'open',
                expiresAt: new Date(Date.now() + 600000),
                priceSnapshot: [
                  {
                    variantId,
                    sku: 'MX-TEST-001',
                    productName: 'Test Phone',
                    quantity: 50,
                    unitPrice: '2.00',
                    subtotal: '100.00',
                    currency: 'LAK',
                  },
                ],
              },
            ];
          }
          if (sql.includes('INSERT INTO ecommerce.orders')) {
            return [{ _id: orderId }];
          }
          if (sql.includes('FROM ecommerce.inventory')) {
            // Only 5 available!
            return [{ _id: 'inv-1', variantId, onHand: 5, reserved: 0, available: 5 }];
          }
          return [];
        },
      },
    };

    const action = new CreateOrderAction(mockRunner, { query: mockRunner.manager.query });
    await assert.rejects(
      () =>
        action.execute({
          customerId,
          checkoutSessionId,
          shippingAddress: validAddress,
        }),
      /Insufficient stock for item "Test Phone"/,
    );
  });

  test('CancelOrderAction releases reservations and sets status cancelled', async () => {
    const queries = [];
    const mockRunner = {
      manager: {
        query: async (sql, params) => {
          queries.push({ sql, params });
          if (sql.includes('SELECT') && sql.includes('FROM ecommerce.orders')) {
            return [
              {
                _id: orderId,
                orderNumber: 'MX-20261117-123456',
                customerId,
                status: 'pending',
                subtotal: '100.00',
                discountAmount: '0.00',
                shippingAmount: '0.00',
                taxAmount: '0.00',
                total: '100.00',
                currency: 'LAK',
                shippingAddress: validAddress,
                createdAt: new Date(),
                updatedAt: new Date(),
              },
            ];
          }
          if (sql.includes('UPDATE ecommerce.orders')) {
            return [
              {
                _id: orderId,
                orderNumber: 'MX-20261117-123456',
                customerId,
                status: 'cancelled',
                subtotal: '100.00',
                discountAmount: '0.00',
                shippingAmount: '0.00',
                taxAmount: '0.00',
                total: '100.00',
                currency: 'LAK',
                shippingAddress: validAddress,
                createdAt: new Date(),
                updatedAt: new Date(),
              },
            ];
          }
          if (sql.includes('FROM ecommerce.inventory_reservations')) {
            return [{ _id: 'res-1', variantId, quantity: 2 }];
          }
          if (sql.includes('FROM ecommerce.inventory')) {
            return [{ _id: 'inv-1', variantId, onHand: 10, reserved: 2, available: 8 }];
          }
          if (sql.includes('FROM ecommerce.order_items')) return [];
          if (sql.includes('FROM ecommerce.order_status_history')) return [];
          return [];
        },
      },
    };

    const action = new CancelOrderAction(mockRunner, { query: mockRunner.manager.query });
    const cancelled = await action.execute(orderId, customerId, 'Changed my mind');

    assert.equal(cancelled.status, 'cancelled');
    // Reserved stock decreased from 2 to 0, available restored from 8 to 10
    const invUpdate = queries.find((q) => q.sql.includes('UPDATE ecommerce.inventory'));
    assert.ok(invUpdate);
    assert.equal(invUpdate.params[0], 0); // newReserved
    assert.equal(invUpdate.params[1], 10); // newAvailable

    const resUpdate = queries.find((q) => q.sql.includes('UPDATE ecommerce.inventory_reservations'));
    assert.ok(resUpdate);
  });

  test('UpdateOrderStatusAction deducts onHand when completed', async () => {
    const queries = [];
    const mockRunner = {
      manager: {
        query: async (sql, params) => {
          queries.push({ sql, params });
          if (sql.includes('FROM ecommerce.orders')) {
            return [
              {
                _id: orderId,
                orderNumber: 'MX-20261117-123456',
                customerId,
                status: 'processing',
                subtotal: '100.00',
                discountAmount: '0.00',
                shippingAmount: '0.00',
                taxAmount: '0.00',
                total: '100.00',
                currency: 'LAK',
                shippingAddress: validAddress,
                createdAt: new Date(),
                updatedAt: new Date(),
              },
            ];
          }
          if (sql.includes('FROM ecommerce.inventory_reservations')) {
            return [{ _id: 'res-1', variantId, quantity: 2 }];
          }
          if (sql.includes('FROM ecommerce.inventory')) {
            return [{ _id: 'inv-1', variantId, onHand: 10, reserved: 2, available: 8 }];
          }
          if (sql.includes('UPDATE ecommerce.orders')) {
            return [
              {
                _id: orderId,
                orderNumber: 'MX-20261117-123456',
                customerId,
                status: 'completed',
                subtotal: '100.00',
                discountAmount: '0.00',
                shippingAmount: '0.00',
                taxAmount: '0.00',
                total: '100.00',
                currency: 'LAK',
                shippingAddress: validAddress,
                createdAt: new Date(),
                updatedAt: new Date(),
              },
            ];
          }
          if (sql.includes('FROM ecommerce.order_items')) return [];
          if (sql.includes('FROM ecommerce.order_status_history')) return [];
          return [];
        },
      },
    };

    const action = new UpdateOrderStatusAction(mockRunner, { query: mockRunner.manager.query });
    const completed = await action.execute(orderId, 'completed', 'Order fulfilled', 'admin');

    assert.equal(completed.status, 'completed');
    // OnHand deducted: 10 - 2 = 8, reserved: 2 - 2 = 0, available: 8
    const invUpdate = queries.find((q) => q.sql.includes('UPDATE ecommerce.inventory'));
    assert.ok(invUpdate);
    assert.equal(invUpdate.params[0], 8); // onHand
    assert.equal(invUpdate.params[1], 0); // reserved
    assert.equal(invUpdate.params[2], 8); // available
  });

  test('AdjustStockAction increases or decreases onHand correctly', async () => {
    let invRow = {
      _id: 'inv-1',
      variantId,
      onHand: 10,
      reserved: 2,
      available: 8,
    };

    const mockRunner = {
      manager: {
        query: async (sql, params) => {
          if (sql.includes('SELECT _id, "variantId"')) {
            return [invRow];
          }
          if (sql.includes('UPDATE ecommerce.inventory')) {
            invRow = {
              ...invRow,
              onHand: params[0],
              available: params[1],
              updatedAt: new Date(),
            };
            return [invRow];
          }
          return [];
        },
      },
    };

    const action = new AdjustStockAction(mockRunner);
    const result = await action.execute({
      variantId,
      quantityDelta: 5,
      type: 'inbound',
      referenceType: 'purchase_order',
      note: 'Supplier restock',
    });

    assert.equal(result.onHand, 15);
    assert.equal(result.available, 13);
  });

  test('ReleaseExpiredReservationsAction releases stale reservations and cancels pending order', async () => {
    const queries = [];
    const mockRunner = {
      manager: {
        query: async (sql, params) => {
          queries.push({ sql, params });
          if (sql.includes('SELECT') && sql.includes('FROM ecommerce.inventory_reservations')) {
            return [{ _id: 'res-stale-1', orderId, variantId, quantity: 3 }];
          }
          if (sql.includes('SELECT') && sql.includes('FROM ecommerce.inventory') && sql.includes('"variantId" = $1')) {
            return [{ _id: 'inv-1', onHand: 10, reserved: 3, available: 7 }];
          }
          if (sql.includes('SELECT') && sql.includes('FROM ecommerce.orders') && sql.includes('_id = $1')) {
            return [{ _id: orderId, status: 'pending' }];
          }
          return [];
        },
      },
    };

    const action = new ReleaseExpiredReservationsAction(mockRunner);
    const releasedCount = await action.execute();

    assert.equal(releasedCount, 1);
    // Reservation updated to expired
    assert.ok(queries.some((q) => q.sql.includes("status = 'expired'")));
    // Inventory reserved restored: 3 - 3 = 0, available: 10 - 0 = 10
    const invUpdate = queries.find((q) => q.sql.includes('SET reserved = $1, available = $2'));
    assert.ok(invUpdate);
    assert.equal(invUpdate.params[0], 0);
    assert.equal(invUpdate.params[1], 10);
    // Pending order auto-cancelled
    assert.ok(queries.some((q) => q.sql.includes("status = 'cancelled'")));
  });

  test('FindOrderByOrderNumberValidation, ReserveStockValidation, and ReleaseOrderReservationsValidation validate inputs', () => {
    const orderNumVal = new FindOrderByOrderNumberValidation();
    assert.throws(() => orderNumVal.execute(''), /orderNumber must be a non-empty string/);
    assert.doesNotThrow(() => orderNumVal.execute('MX-20261118-00123'));

    const reserveVal = new ReserveStockValidation();
    assert.throws(() => reserveVal.execute('bad', variantId, 5), /orderId must be a valid UUID/);
    assert.throws(() => reserveVal.execute(orderId, 'bad', 5), /variantId must be a valid UUID/);
    assert.throws(() => reserveVal.execute(orderId, variantId, 0), /quantity must be an integer greater than 0/);
    assert.doesNotThrow(() => reserveVal.execute(orderId, variantId, 5));

    const releaseVal = new ReleaseOrderReservationsValidation();
    assert.throws(() => releaseVal.execute('bad'), /orderId must be a valid UUID/);
    assert.doesNotThrow(() => releaseVal.execute(orderId));
  });

  test('ReserveStockAction and ReleaseOrderReservationsAction perform CRUD on reservations and inventory', async () => {
    const queries = [];
    const mockRunner = {
      manager: {
        query: async (sql, params) => {
          queries.push({ sql, params });
          if (sql.includes('SELECT _id, "onHand"') && sql.includes('FROM ecommerce.inventory')) {
            return [{ _id: 'inv-1', variantId, onHand: 10, reserved: 2, available: 8 }];
          }
          if (sql.includes('INSERT INTO ecommerce.inventory_reservations')) {
            return [{ _id: 'res-new-1', orderId, variantId, quantity: 3, status: 'active', expiresAt: new Date(), createdAt: new Date(), updatedAt: new Date() }];
          }
          if (sql.includes('FROM ecommerce.inventory_reservations') && sql.includes('"orderId" = $1')) {
            return [{ _id: 'res-new-1', variantId, quantity: 3 }];
          }
          if (sql.includes('FROM ecommerce.inventory') && sql.includes('FOR UPDATE')) {
            return [{ _id: 'inv-1', onHand: 10, reserved: 5, available: 5 }];
          }
          return [];
        },
      },
    };

    const reserveAction = new ReserveStockAction(mockRunner);
    const reservation = await reserveAction.execute(orderId, variantId, 3);
    assert.equal(reservation._id, 'res-new-1');
    assert.equal(reservation.quantity, 3);

    const releaseAction = new ReleaseOrderReservationsAction(mockRunner);
    await releaseAction.execute(orderId, 'Order cancelled');
    assert.ok(queries.some((q) => q.sql.includes('UPDATE ecommerce.inventory_reservations')));
  });
});
