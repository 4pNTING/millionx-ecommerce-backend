import { QueryRunner } from 'typeorm';

export class ReleaseOrderReservationsAction {
  constructor(private readonly session: QueryRunner) {}

  async execute(orderId: string, reason?: string): Promise<void> {
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
        `SELECT "onHand", reserved
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
           ) VALUES ($1, 'released', $2, 'order', $3, $4)`,
          [variantId, qty, orderId, reason || 'Released reservations'],
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
}
