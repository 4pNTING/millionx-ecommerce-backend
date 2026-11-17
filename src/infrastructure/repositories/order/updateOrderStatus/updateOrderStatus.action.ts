import { BadRequestException, NotFoundException } from '@nestjs/common';
import { DataSource, QueryRunner } from 'typeorm';
import { OrderModel, OrderStatus } from '../../../../domain/models/order.model';
import { OrderDetailsMapper } from '../order-details.mapper';

export class UpdateOrderStatusAction {
  private readonly mapper: OrderDetailsMapper;

  constructor(
    private readonly session: QueryRunner,
    private readonly dataSource: DataSource,
  ) {
    this.mapper = new OrderDetailsMapper(dataSource);
  }

  async execute(
    orderId: string,
    newStatus: OrderStatus,
    note?: string,
    changedBy?: string,
  ): Promise<OrderModel> {
    const [order] = await this.session.manager.query(
      `SELECT _id, "orderNumber", "customerId", "checkoutSessionId",
              subtotal, "discountAmount", "shippingAmount", "taxAmount",
              total, currency, status, "shippingAddress", "billingAddress", notes,
              "createdAt", "updatedAt"
       FROM ecommerce.orders
       WHERE _id = $1
       FOR UPDATE`,
      [orderId],
    );

    if (!order) {
      throw new NotFoundException(`Order ${orderId} not found`);
    }

    const oldStatus = order.status;
    if (oldStatus === newStatus) {
      return this.mapper.hydrateOrder(order, this.session);
    }

    if (oldStatus === 'cancelled' || oldStatus === 'completed') {
      throw new BadRequestException(
        `Cannot change status of order that is already ${oldStatus}`,
      );
    }

    // 1. If transitioning to 'cancelled', release active reservations
    if (newStatus === 'cancelled') {
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
    }

    // 2. If transitioning to 'completed', consume reservations & deduct from onHand
    if (newStatus === 'completed') {
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
          const newOnHand = Math.max(0, Number(inv.onHand) - qty);
          const newReserved = Math.max(0, Number(inv.reserved) - qty);
          const newAvailable = newOnHand - newReserved;

          await this.session.manager.query(
            `UPDATE ecommerce.inventory
             SET "onHand" = $1, reserved = $2, available = $3, "updatedAt" = now()
             WHERE "variantId" = $4`,
            [newOnHand, newReserved, newAvailable, variantId],
          );

          await this.session.manager.query(
            `INSERT INTO ecommerce.inventory_movements (
               "variantId", type, quantity, "referenceType", "referenceId", note
             ) VALUES ($1, 'outbound', $2, 'order', $3, 'Fulfilled and deducted from onHand')`,
            [variantId, qty, orderId],
          );
        }

        await this.session.manager.query(
          `UPDATE ecommerce.inventory_reservations
           SET status = 'consumed', "updatedAt" = now()
           WHERE _id = $1`,
          [res._id],
        );
      }
    }

    // 3. Update order status
    const updateRes = await this.session.manager.query(
      `UPDATE ecommerce.orders
       SET status = $1, "updatedAt" = now()
       WHERE _id = $2
       RETURNING *`,
      [newStatus, orderId],
    );
    const updatedOrder = Array.isArray(updateRes[0]) ? updateRes[0][0] : updateRes[0];

    // 4. Record status history
    await this.session.manager.query(
      `INSERT INTO ecommerce.order_status_history (
         "orderId", "fromStatus", "toStatus", note, "createdBy"
       ) VALUES ($1, $2, $3, $4, $5)`,
      [
        orderId,
        oldStatus,
        newStatus,
        note || `Status changed from ${oldStatus} to ${newStatus}`,
        changedBy || 'staff',
      ],
    );

    return this.mapper.hydrateOrder(updatedOrder, this.session);
  }
}
