import { BadRequestException } from '@nestjs/common';
import { QueryRunner } from 'typeorm';
import { InventoryReservationModel } from '../../../../domain/models/inventory.model';

export class ReserveStockAction {
  constructor(private readonly session: QueryRunner) {}

  async execute(
    orderId: string,
    variantId: string,
    quantity: number,
    expiresInMinutes = 30,
  ): Promise<InventoryReservationModel> {
    const expiresAt = new Date(Date.now() + expiresInMinutes * 60 * 1000);

    const [inv] = await this.session.manager.query(
      `SELECT _id, "onHand", reserved, available
       FROM ecommerce.inventory
       WHERE "variantId" = $1
       FOR UPDATE`,
      [variantId],
    );

    if (!inv || Number(inv.available) < quantity) {
      throw new BadRequestException(
        `Insufficient stock for variant ${variantId}: available ${inv?.available ?? 0}, requested ${quantity}`,
      );
    }

    const newReserved = Number(inv.reserved) + quantity;
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
       ) VALUES ($1, 'reserved', $2, 'order', $3, 'Reservation on order')`,
      [variantId, quantity, orderId],
    );

    const [res] = await this.session.manager.query(
      `INSERT INTO ecommerce.inventory_reservations (
         "orderId", "variantId", quantity, status, "expiresAt"
       ) VALUES ($1, $2, $3, 'active', $4)
       RETURNING *`,
      [orderId, variantId, quantity, expiresAt],
    );

    return {
      _id: res._id,
      orderId: res.orderId,
      variantId: res.variantId,
      quantity: Number(res.quantity),
      status: res.status,
      expiresAt: new Date(res.expiresAt),
      createdAt: new Date(res.createdAt),
      updatedAt: new Date(res.updatedAt),
    };
  }
}
