import { QueryRunner } from 'typeorm';

export class ReleaseExpiredReservationsAction {
  constructor(private readonly session: QueryRunner) {}

  async execute(): Promise<number> {
    const expiredReservations = await this.session.manager.query(
      `SELECT _id, "orderId", "variantId", quantity
       FROM ecommerce.inventory_reservations
       WHERE status = 'active' AND "expiresAt" < now()
       FOR UPDATE`,
    );

    if (expiredReservations.length === 0) {
      return 0;
    }

    for (const res of expiredReservations) {
      const qty = Number(res.quantity);
      const variantId = res.variantId;
      const orderId = res.orderId;

      // 1. Update reservation status
      await this.session.manager.query(
        `UPDATE ecommerce.inventory_reservations
         SET status = 'expired', "updatedAt" = now()
         WHERE _id = $1`,
        [res._id],
      );

      // 2. Return reserved stock to available
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
           ) VALUES ($1, 'released', $2, 'reservation_release', $3, 'Released expired reservation')`,
          [variantId, qty, orderId],
        );
      }

      // 3. If order is still 'pending', auto-cancel it
      if (orderId) {
        const [order] = await this.session.manager.query(
          `SELECT _id, status FROM ecommerce.orders WHERE _id = $1 FOR UPDATE`,
          [orderId],
        );

        if (order && order.status === 'pending') {
          await this.session.manager.query(
            `UPDATE ecommerce.orders
             SET status = 'cancelled', "updatedAt" = now()
             WHERE _id = $1`,
            [orderId],
          );

          await this.session.manager.query(
            `INSERT INTO ecommerce.order_status_history (
               "orderId", "fromStatus", "toStatus", note, "createdBy"
             ) VALUES ($1, 'pending', 'cancelled', 'Auto-cancelled due to expired reservation', 'system')`,
            [orderId],
          );
        }
      }
    }

    return expiredReservations.length;
  }
}
