import { BadRequestException, NotFoundException } from '@nestjs/common';
import { DataSource, QueryRunner } from 'typeorm';
import { CreateOrderRequest, OrderModel } from '../../../../domain/models/order.model';
import { OrderDetailsMapper } from '../order-details.mapper';

export class CreateOrderAction {
  private readonly mapper: OrderDetailsMapper;

  constructor(
    private readonly session: QueryRunner,
    private readonly dataSource: DataSource,
  ) {
    this.mapper = new OrderDetailsMapper(dataSource);
  }

  async execute(input: CreateOrderRequest): Promise<OrderModel> {
    const { customerId, checkoutSessionId, shippingAddress, billingAddress, notes } = input;

    // 1. Load checkout session
    const [sessionRow] = await this.session.manager.query(
      `SELECT _id, "cartId", "customerId", subtotal, "discountAmount", "shippingAmount", "taxAmount",
              total, currency, "priceSnapshot", status, "expiresAt"
       FROM ecommerce.checkout_sessions
       WHERE _id = $1
       FOR UPDATE`,
      [checkoutSessionId],
    );

    if (!sessionRow) {
      throw new NotFoundException(`Checkout session ${checkoutSessionId} not found`);
    }

    if (sessionRow.customerId && sessionRow.customerId !== customerId) {
      throw new BadRequestException('Checkout session does not belong to this customer');
    }

    if (sessionRow.status !== 'open') {
      throw new BadRequestException(`Checkout session is not open (status: ${sessionRow.status})`);
    }

    if (new Date(sessionRow.expiresAt).getTime() <= Date.now()) {
      await this.session.manager.query(
        `UPDATE ecommerce.checkout_sessions
         SET status = 'expired', "updatedAt" = now()
         WHERE _id = $1`,
        [checkoutSessionId],
      );
      throw new BadRequestException('Checkout session has expired');
    }

    const priceSnapshot =
      typeof sessionRow.priceSnapshot === 'string'
        ? JSON.parse(sessionRow.priceSnapshot)
        : sessionRow.priceSnapshot;

    if (!Array.isArray(priceSnapshot) || priceSnapshot.length === 0) {
      throw new BadRequestException('Checkout session has no items');
    }

    // 2. Generate Order ID and human-readable Order Number
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randomSuffix = Math.floor(100000 + Math.random() * 900000);
    const orderNumber = `MX-${dateStr}-${randomSuffix}`;

    const [orderInsert] = await this.session.manager.query(
      `INSERT INTO ecommerce.orders (
         "orderNumber", "customerId", "checkoutSessionId",
         subtotal, "discountAmount", "shippingAmount", "taxAmount",
         total, currency, status, "shippingAddress", "billingAddress", notes
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'pending', $10, $11, $12)
       RETURNING *`,
      [
        orderNumber,
        customerId,
        checkoutSessionId,
        sessionRow.subtotal,
        sessionRow.discountAmount,
        sessionRow.shippingAmount,
        sessionRow.taxAmount,
        sessionRow.total,
        sessionRow.currency,
        JSON.stringify(shippingAddress),
        billingAddress ? JSON.stringify(billingAddress) : null,
        notes ?? null,
      ],
    );
    const orderId = orderInsert._id;

    // 3. Process each item: Pessimistic Lock & Reserve Inventory
    const reservationExpiry = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes

    for (const item of priceSnapshot) {
      const variantId = item.variantId;
      const quantity = Number(item.quantity);

      // Pessimistic Lock on inventory row
      let [invRow] = await this.session.manager.query(
        `SELECT _id, "variantId", "onHand", reserved, available
         FROM ecommerce.inventory
         WHERE "variantId" = $1
         FOR UPDATE`,
        [variantId],
      );

      // If no inventory row exists, create one with default 100 stock
      if (!invRow) {
        const [newInv] = await this.session.manager.query(
          `INSERT INTO ecommerce.inventory (_id, "variantId", "onHand", reserved, available, "updatedAt")
           VALUES (gen_random_uuid(), $1, 100, 0, 100, now())
           RETURNING *`,
          [variantId],
        );
        invRow = newInv;
      }

      if (Number(invRow.available) < quantity) {
        throw new BadRequestException(
          `Insufficient stock for item "${item.productName}" (SKU: ${item.sku}). Requested: ${quantity}, Available: ${invRow.available}`,
        );
      }

      // Update inventory (increase reserved, decrease available)
      const newReserved = Number(invRow.reserved) + quantity;
      const newAvailable = Number(invRow.onHand) - newReserved;

      await this.session.manager.query(
        `UPDATE ecommerce.inventory
         SET reserved = $1, available = $2, "updatedAt" = now()
         WHERE "variantId" = $3`,
        [newReserved, newAvailable, variantId],
      );

      // Record movement
      await this.session.manager.query(
        `INSERT INTO ecommerce.inventory_movements (
           "variantId", type, quantity, "referenceType", "referenceId", note
         ) VALUES ($1, 'reserved', $2, 'order', $3, 'Reserved on order creation')`,
        [variantId, quantity, orderId],
      );

      // Create reservation
      await this.session.manager.query(
        `INSERT INTO ecommerce.inventory_reservations (
           "orderId", "variantId", quantity, status, "expiresAt"
         ) VALUES ($1, $2, $3, 'active', $4)`,
        [orderId, variantId, quantity, reservationExpiry],
      );

      // Insert Order Item
      await this.session.manager.query(
        `INSERT INTO ecommerce.order_items (
           "orderId", "variantId", sku, "productName", "variantName",
           quantity, "unitPrice", subtotal
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          orderId,
          variantId,
          item.sku,
          item.productName,
          item.variantName || 'Standard',
          quantity,
          item.unitPrice,
          item.subtotal,
        ],
      );
    }

    // 4. Record order status history
    await this.session.manager.query(
      `INSERT INTO ecommerce.order_status_history (
         "orderId", "fromStatus", "toStatus", note, "createdBy"
       ) VALUES ($1, NULL, 'pending', 'Order created from checkout session', 'customer')`,
      [orderId],
    );

    // 5. Complete Checkout Session
    await this.session.manager.query(
      `UPDATE ecommerce.checkout_sessions
       SET status = 'completed', "updatedAt" = now()
       WHERE _id = $1`,
      [checkoutSessionId],
    );

    // 6. Deactivate the cart
    if (sessionRow.cartId) {
      await this.session.manager.query(
        `UPDATE ecommerce.carts
         SET "isActive" = false, "updatedAt" = now()
         WHERE _id = $1`,
        [sessionRow.cartId],
      );
    }

    return this.mapper.hydrateOrder(orderInsert, this.session);
  }
}
