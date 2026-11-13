const assert = require('node:assert/strict');
const { test, describe } = require('node:test');
const {
  GetOrCreateCartValidation,
} = require('../../src/infrastructure/repositories/cart/getOrCreateCart/getOrCreateCart.validation');
const {
  AddToCartValidation,
} = require('../../src/infrastructure/repositories/cart/addToCart/addToCart.validation');
const {
  UpdateCartItemValidation,
} = require('../../src/infrastructure/repositories/cart/updateCartItem/updateCartItem.validation');
const {
  RemoveCartItemValidation,
} = require('../../src/infrastructure/repositories/cart/removeCartItem/removeCartItem.validation');
const {
  MergeCartsValidation,
} = require('../../src/infrastructure/repositories/cart/mergeCarts/mergeCarts.validation');
const {
  CreateCheckoutSessionValidation,
} = require('../../src/infrastructure/repositories/checkout/createCheckoutSession/createCheckoutSession.validation');
const {
  AddToWishlistValidation,
} = require('../../src/infrastructure/repositories/wishlist/addToWishlist/addToWishlist.validation');
const {
  RemoveFromWishlistValidation,
} = require('../../src/infrastructure/repositories/wishlist/removeFromWishlist/removeFromWishlist.validation');

const {
  GetOrCreateCartAction,
} = require('../../src/infrastructure/repositories/cart/getOrCreateCart/getOrCreateCart.action');
const {
  AddToCartAction,
} = require('../../src/infrastructure/repositories/cart/addToCart/addToCart.action');
const {
  UpdateCartItemAction,
} = require('../../src/infrastructure/repositories/cart/updateCartItem/updateCartItem.action');
const {
  RemoveCartItemAction,
} = require('../../src/infrastructure/repositories/cart/removeCartItem/removeCartItem.action');
const {
  MergeCartsAction,
} = require('../../src/infrastructure/repositories/cart/mergeCarts/mergeCarts.action');
const {
  CreateCheckoutSessionAction,
} = require('../../src/infrastructure/repositories/checkout/createCheckoutSession/createCheckoutSession.action');

describe('Phase 2 — Shopping validations & business logic', () => {
  const customerId = 'a0000000-0000-4000-8000-000000000001';
  const productId = 'b0000000-0000-4000-8000-000000000002';
  const variantId1 = 'c0000000-0000-4000-8000-000000000003';
  const variantId2 = 'c0000000-0000-4000-8000-000000000004';
  const cartItemId1 = 'd0000000-0000-4000-8000-000000000005';

  test('GetOrCreateCartValidation requires either customerId or sessionId', () => {
    const validator = new GetOrCreateCartValidation();
    assert.throws(
      () => validator.execute(undefined, undefined),
      /Either customerId or sessionId must be provided/,
    );
    assert.doesNotThrow(() => validator.execute(customerId, undefined));
    assert.doesNotThrow(() => validator.execute(undefined, 'session-123'));
    assert.doesNotThrow(() => validator.execute(customerId, 'session-123'));
  });

  test('AddToCartValidation validates UUID, quantity >= 1, and actor identity', () => {
    const validator = new AddToCartValidation();
    assert.throws(
      () => validator.execute({ variantId: variantId1, quantity: 1 }),
      /Either customerId or sessionId must be provided/,
    );
    assert.throws(
      () => validator.execute({ customerId, variantId: 'invalid-uuid', quantity: 1 }),
      /Valid variantId UUID is required/,
    );
    assert.throws(
      () => validator.execute({ customerId, variantId: variantId1, quantity: 0 }),
      /Quantity must be at least 1/,
    );
    assert.throws(
      () => validator.execute({ customerId, variantId: variantId1, quantity: -2 }),
      /Quantity must be at least 1/,
    );
    assert.doesNotThrow(() =>
      validator.execute({ customerId, variantId: variantId1, quantity: 3 }),
    );
    assert.doesNotThrow(() =>
      validator.execute({ sessionId: 'guest-session-1', variantId: variantId1, quantity: 1 }),
    );
  });

  test('UpdateCartItemValidation validates cartItemId UUID and non-negative quantity', () => {
    const validator = new UpdateCartItemValidation();
    assert.throws(
      () => validator.execute({ cartItemId: 'bad-id', quantity: 1 }),
      /Valid cartItemId UUID is required/,
    );
    assert.throws(
      () => validator.execute({ cartItemId: cartItemId1, quantity: -1 }),
      /Quantity must be 0 or greater/,
    );
    assert.doesNotThrow(() => validator.execute({ cartItemId: cartItemId1, quantity: 0 }));
    assert.doesNotThrow(() => validator.execute({ cartItemId: cartItemId1, quantity: 5 }));
  });

  test('RemoveCartItemValidation validates cartItemId UUID', () => {
    const validator = new RemoveCartItemValidation();
    assert.throws(
      () => validator.execute({ cartItemId: 'not-uuid' }),
      /Valid cartItemId UUID is required/,
    );
    assert.doesNotThrow(() => validator.execute({ cartItemId: cartItemId1 }));
  });

  test('MergeCartsValidation requires non-empty sessionId and valid customerId UUID', () => {
    const validator = new MergeCartsValidation();
    assert.throws(
      () => validator.execute({ sessionId: '', customerId }),
      /Guest sessionId is required/,
    );
    assert.throws(
      () => validator.execute({ sessionId: 'guest-1', customerId: 'not-uuid' }),
      /Valid customerId UUID is required/,
    );
    assert.doesNotThrow(() => validator.execute({ sessionId: 'guest-1', customerId }));
  });

  test('CreateCheckoutSessionValidation requires cartId, customerId, or sessionId', () => {
    const validator = new CreateCheckoutSessionValidation();
    assert.throws(
      () => validator.execute({}),
      /At least one of cartId, customerId, or sessionId is required/,
    );
    assert.doesNotThrow(() =>
      validator.execute({ cartId: 'e0000000-0000-4000-8000-000000000006' }),
    );
    assert.doesNotThrow(() => validator.execute({ customerId }));
    assert.doesNotThrow(() => validator.execute({ sessionId: 'session-xyz' }));
  });

  test('Wishlist validations require valid customerId and productId UUIDs', () => {
    const addValidator = new AddToWishlistValidation();
    assert.throws(
      () => addValidator.execute({ customerId: 'not-uuid', productId }),
      /Valid customerId UUID is required/,
    );
    assert.throws(
      () => addValidator.execute({ customerId, productId: 'not-uuid' }),
      /Valid productId UUID is required/,
    );
    assert.doesNotThrow(() => addValidator.execute({ customerId, productId }));

    const removeValidator = new RemoveFromWishlistValidation();
    assert.throws(
      () => removeValidator.execute({ customerId: 'not-uuid', productId }),
      /Valid customerId UUID is required/,
    );
    assert.throws(
      () => removeValidator.execute({ customerId, productId: 'not-uuid' }),
      /Valid productId UUID is required/,
    );
    assert.doesNotThrow(() => removeValidator.execute({ customerId, productId }));
  });

  test('GetOrCreateCartAction returns existing active cart or creates new active cart', async () => {
    let savedCart = null;
    const mockRepo = {
      findOne: async ({ where }) => {
        if (where.customerId === customerId && savedCart) return savedCart;
        return null;
      },
      create: (data) => ({ _id: 'cart-1', ...data }),
      save: async (entity) => {
        savedCart = entity;
        return entity;
      },
    };

    const action = new GetOrCreateCartAction(mockRepo);
    const cart = await action.execute(customerId);
    assert.equal(cart._id, 'cart-1');
    assert.equal(cart.customerId, customerId);
    assert.equal(cart.isActive, true);

    // Second call returns existing active cart without re-creating
    const cart2 = await action.execute(customerId);
    assert.equal(cart2._id, 'cart-1');
  });

  test('AddToCartAction adds item or increments quantity if variant already in cart', async () => {
    const cart = { _id: 'cart-1', customerId, isActive: true };
    const items = [];
    const mockSession = {
      manager: {
        getRepository: (entityClass) => {
          const name = entityClass.name;
          if (name === 'ProductVariantEntity') {
            return {
              findOne: async () => ({ _id: variantId1, productId, isActive: true }),
            };
          }
          if (name === 'ProductEntity') {
            return {
              findOne: async () => ({ _id: productId, isActive: true }),
            };
          }
          if (name === 'CartEntity') {
            return {
              findOne: async () => cart,
              create: (d) => ({ _id: 'cart-1', ...d }),
              save: async (c) => c,
            };
          }
          if (name === 'CartItemEntity') {
            return {
              findOne: async ({ where }) =>
                items.find((i) => i.cartId === where.cartId && i.variantId === where.variantId) ||
                null,
              create: (d) => ({ _id: 'item-1', ...d }),
              save: async (item) => {
                const idx = items.findIndex((i) => i.variantId === item.variantId);
                if (idx >= 0) items[idx] = item;
                else items.push(item);
                return item;
              },
            };
          }
          throw new Error('Unknown entity: ' + name);
        },
      },
    };

    const mockMapper = {
      hydrateCart: async (c) => ({
        _id: c._id,
        items: items.map((i) => ({ variantId: i.variantId, quantity: i.quantity })),
        totalItems: items.reduce((acc, i) => acc + i.quantity, 0),
      }),
    };

    const action = new AddToCartAction(mockSession, mockMapper);
    // 1st add: quantity 2
    const res1 = await action.execute({ customerId, variantId: variantId1, quantity: 2 });
    assert.equal(res1.totalItems, 2);

    // 2nd add: quantity 3 -> total should be 5
    const res2 = await action.execute({ customerId, variantId: variantId1, quantity: 3 });
    assert.equal(res2.totalItems, 5);
  });

  test('MergeCartsAction merges guest cart into member cart inside a transaction', async () => {
    const memberCart = { _id: 'member-cart-id', customerId, isActive: true };
    const guestCart = { _id: 'guest-cart-id', sessionId: 'guest-session-1', isActive: true };

    let memberItems = [
      { _id: 'm-item-1', cartId: memberCart._id, variantId: variantId1, quantity: 1 },
    ];
    let guestItems = [
      { _id: 'g-item-1', cartId: guestCart._id, variantId: variantId1, quantity: 2 }, // duplicate variant
      { _id: 'g-item-2', cartId: guestCart._id, variantId: variantId2, quantity: 4 }, // new variant
    ];

    const mockSession = {
      manager: {
        getRepository: (entityClass) => {
          const name = entityClass.name;
          if (name === 'CartEntity') {
            return {
              findOne: async ({ where }) => {
                if (where.customerId === customerId) return memberCart;
                if (where.sessionId === 'guest-session-1') return guestCart;
                return null;
              },
              save: async (c) => c,
            };
          }
          if (name === 'CartItemEntity') {
            return {
              find: async ({ where }) => {
                if (where.cartId === memberCart._id) return memberItems;
                if (where.cartId === guestCart._id) return guestItems;
                return [];
              },
              create: (d) => ({ _id: 'new-item-' + d.variantId, ...d }),
              save: async (item) => {
                const idx = memberItems.findIndex((i) => i.variantId === item.variantId);
                if (idx >= 0) memberItems[idx] = item;
                else memberItems.push(item);
                return item;
              },
              delete: async ({ cartId }) => {
                if (cartId === guestCart._id) guestItems = [];
              },
            };
          }
          throw new Error('Unknown entity: ' + name);
        },
      },
    };

    const mockMapper = {
      hydrateCart: async (c) => ({
        _id: c._id,
        items: memberItems,
        totalItems: memberItems.reduce((acc, i) => acc + i.quantity, 0),
      }),
    };

    const action = new MergeCartsAction(mockSession, mockMapper);
    const result = await action.execute({ customerId, sessionId: 'guest-session-1' });

    // member variantId1 quantity was 1 + guest quantity 2 = 3
    const item1 = result.items.find((i) => i.variantId === variantId1);
    assert.equal(item1.quantity, 3);

    // new variantId2 added with quantity 4
    const item2 = result.items.find((i) => i.variantId === variantId2);
    assert.equal(item2.quantity, 4);

    // guest cart deactivated and mergedIntoCartId set
    assert.equal(guestCart.isActive, false);
    assert.equal(guestCart.mergedIntoCartId, memberCart._id);
    assert.equal(guestItems.length, 0);
  });

  test('CreateCheckoutSessionAction computes subtotal, taxes, shipping, snapshot and expiry', async () => {
    const cart = { _id: 'cart-1', customerId, isActive: true };
    let savedSession = null;
    const mockSession = {
      manager: {
        getRepository: (entityClass) => {
          const name = entityClass.name;
          if (name === 'CartEntity') {
            return { findOne: async () => cart };
          }
          if (name === 'CheckoutSessionEntity') {
            return {
              create: (data) => data,
              save: async (data) => {
                savedSession = { _id: 'session-checkout-1', ...data };
                return savedSession;
              },
            };
          }
          throw new Error('Unknown entity: ' + name);
        },
      },
    };

    const mockDataSource = {
      query: async () => [
        {
          cartItemId: 'item-1',
          variantId: variantId1,
          quantity: 2,
          sku: 'SKU-001',
          variantName: '500ml',
          variantActive: true,
          productId,
          productName: 'Dove Body Wash',
          productActive: true,
          unitPrice: '141300.00',
          compareAtPrice: '259000.00',
          currency: 'LAK',
        },
      ],
    };

    const action = new CreateCheckoutSessionAction(mockSession, mockDataSource);
    const session = await action.execute({
      cartId: 'cart-1',
      shippingAmount: '15000.00',
      taxAmount: '5000.00',
      discountAmount: '10000.00',
    });

    // 2 * 141300 = 282600
    assert.equal(session.subtotal, '282600.00');
    assert.equal(session.shippingAmount, '15000.00');
    assert.equal(session.discountAmount, '10000.00');
    assert.equal(session.taxAmount, '5000.00');
    // total = 282600 - 10000 + 15000 + 5000 = 292600.00
    assert.equal(session.total, '292600.00');
    assert.equal(session.currency, 'LAK');
    assert.equal(session.status, 'open');
    assert.equal(session.priceSnapshot.length, 1);
    assert.equal(session.priceSnapshot[0].sku, 'SKU-001');
    assert.equal(session.priceSnapshot[0].unitPrice, '141300.00');
    assert.ok(session.expiresAt.getTime() > Date.now() + 25 * 60 * 1000);
  });
});
