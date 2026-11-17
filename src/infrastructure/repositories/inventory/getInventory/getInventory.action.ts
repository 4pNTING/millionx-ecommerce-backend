import { DataSource } from 'typeorm';
import { InventoryModel } from '../../../../domain/models/inventory.model';
import { InventoryDetailsMapper } from '../inventory-details.mapper';

export class GetInventoryAction {
  private readonly mapper = new InventoryDetailsMapper();

  constructor(private readonly dataSource: DataSource) {}

  async execute(variantId: string): Promise<InventoryModel | null> {
    const [row] = await this.dataSource.query(
      `SELECT _id, "variantId", "onHand", reserved, available, "updatedAt"
       FROM ecommerce.inventory
       WHERE "variantId" = $1`,
      [variantId],
    );

    if (!row) {
      return null;
    }

    return this.mapper.mapRow(row);
  }
}
