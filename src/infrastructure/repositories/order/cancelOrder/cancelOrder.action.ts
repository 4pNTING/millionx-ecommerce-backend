import { BadRequestException, NotFoundException } from '@nestjs/common';
import { DataSource, QueryRunner } from 'typeorm';
import { OrderModel } from '../../../../domain/models/order.model';
import { OrderDetailsMapper } from '../order-details.mapper';

export class CancelOrderAction {
  private readonly mapper: OrderDetailsMapper;

  constructor(
    private readonly session: QueryRunner,
    private readonly dataSource: DataSource,
  ) {
    this.mapper = new OrderDetailsMapper(dataSource);
  }

  async execute(orderId: string, customerId?: string, reason?: string): Promise<OrderModel> {
    const params: any[] = [orderId];
    let query = `
      SELECT _id, "orderNumber", "customerId", "checkoutSessionId",
             subtotal, "discountAmount", "shippingAmount", "taxAmount",
             total, currency, status, "shippingAddress", "billingAddress", notes,
             "createdAt", "updatedAt"
      FROM ecommerce.orders
      WHERE _id = $1
      FOR UPDATE
    `;

    if (customerId) {
      query = `
        SELECT _id, "orderNumber", "customerId", "checkoutSessionId",
               subtotal, "discountAmount", "shippingAmount", "taxAmount",
               total, currency, status, "shippingAddress", "billingAddress", notes,
               "createdAt", "updatedAt"
        FROM ecommerce.orders
        WHERE _id = $1 AND "customerId" = $2
        FOR UPDATE
      `;
      params.push(customerId);
    }

    const [order] = await this.session.manager.query(query, params);
    if (!order) {
      throw new NotFoundException(`Order ${orderId} not found`);
    }

    if (order.status === 'cancelled') {
      throw new BadRequestException('Order is already cancelled');
    }

    if (order.status === 'completed') {
      throw new BadRequestException('Completed orders cannot be cancelled directly');
    }

    const oldStatus = order.status;

    // 1. Update order status to 'cancelled'
    const updateRes = await this.session.manager.query(
      `UPDATE ecommerce.orders
       SET status = 'cancelled', "updatedAt" = now()
       WHERE _id = $1
       RETURNING *`,
      [orderId],
    );
    const updatedOrder = Array.isArray(updateRes[0]) ? updateRes[0][0] : updateRes[0];

    // 2. Insert status history
    await this.session.manager.query(
      `INSERT INTO ecommerce.order_status_history (
         "orderId", "fromStatus", "toStatus", note, "createdBy"
       ) VALUES ($1, $2, 'cancelled', $3, $4)`,
      [
        orderId,
        oldStatus,
        reason || 'Order cancelled',
        customerId ? 'customer' : 'staff',
      ],
    );

    // 3. Release reservations
    const reservations = await this.session.manager.query(
      `SELECT _id, "variantId", quantity
       FROM ecommerce.inventory_reservations
       WHERE "orderId" = $1 AND status = 'active'
       FOR UPDATE`,
      [orderId],
    );

    for (const res of reservations) {
      const qty = Number(res.quantity);
      const variantId = res.variantId;

      const [inv] = await this.session.manager.query(
        `SELECT _id, "onHand", reserved, available
         FROM ecommerce.inventory
         WHERE "variantId" = $1
         FOR UPDATE`,
        [variantId],
      );

      if (inv) {
        const newReserved = Math.max(0, Number(inv.reserved) - qty);
        const newAvailable = Number(inv.onHand) - newReserved;

        await this.session.manager.query(
          `UPDATE ecommerce.inventory
           SET reserved = $1, available = $2, "updatedAt" = now()
           WHERE "variantId" = $3`,
          [newReserved, newAvailable, variantId],
        );

        await this.session.manager.query(
          `INSERT INTO ecommerce.inventory_movements (
             "variantId", type, quantity, "referenceType", "referenceId", note
           ) VALUES ($1, 'released', $2, 'order', $3, 'Reservation released on order cancellation')`,
          [variantId, qty, orderId],
        );
      }

      await this.session.manager.query(
        `UPDATE ecommerce.inventory_reservations
         SET status = 'released', "updatedAt" = now()
         WHERE _id = $1`,
        [res._id],
      );
    }

    return this.mapper.hydrateOrder(updatedOrder, this.session);
  }
}
