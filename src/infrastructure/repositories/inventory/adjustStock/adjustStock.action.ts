import { BadRequestException } from '@nestjs/common';
import { QueryRunner } from 'typeorm';
import { AdjustStockRequest, InventoryModel } from '../../../../domain/models/inventory.model';
import { InventoryDetailsMapper } from '../inventory-details.mapper';

export class AdjustStockAction {
  private readonly mapper = new InventoryDetailsMapper();

  constructor(private readonly session: QueryRunner) {}

  async execute(input: AdjustStockRequest): Promise<InventoryModel> {
    const { variantId, quantityDelta, type, referenceType, referenceId, note } = input;

    let [inv] = await this.session.manager.query(
      `SELECT _id, "variantId", "onHand", reserved, available
       FROM ecommerce.inventory
       WHERE "variantId" = $1
       FOR UPDATE`,
      [variantId],
    );

    if (!inv) {
      const [newInv] = await this.session.manager.query(
        `INSERT INTO ecommerce.inventory (_id, "variantId", "onHand", reserved, available, "updatedAt")
         VALUES (gen_random_uuid(), $1, 0, 0, 0, now())
         RETURNING *`,
        [variantId],
      );
      inv = newInv;
    }

    const currentOnHand = Number(inv.onHand);
    const currentReserved = Number(inv.reserved);
    const newOnHand = currentOnHand + quantityDelta;

    if (newOnHand < currentReserved) {
      throw new BadRequestException(
        `Cannot adjust stock: new on-hand (${newOnHand}) would be less than currently reserved (${currentReserved})`,
      );
    }

    const newAvailable = newOnHand - currentReserved;

    const updateRes = await this.session.manager.query(
      `UPDATE ecommerce.inventory
       SET "onHand" = $1, available = $2, "updatedAt" = now()
       WHERE "variantId" = $3
       RETURNING *`,
      [newOnHand, newAvailable, variantId],
    );
    const updated = Array.isArray(updateRes[0]) ? updateRes[0][0] : updateRes[0];

    await this.session.manager.query(
      `INSERT INTO ecommerce.inventory_movements (
         "variantId", type, quantity, "referenceType", "referenceId", note
       ) VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        variantId,
        type,
        quantityDelta,
        referenceType,
        referenceId ?? null,
        note ?? 'Stock adjustment',
      ],
    );

    return this.mapper.mapRow(updated);
  }
}
