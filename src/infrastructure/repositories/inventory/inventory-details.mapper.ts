import { InventoryModel } from '../../../domain/models/inventory.model';

export class InventoryDetailsMapper {
  mapRow(row: any): InventoryModel {
    return {
      _id: row._id,
      variantId: row.variantId,
      onHand: Number(row.onHand),
      reserved: Number(row.reserved),
      available: Number(row.available),
      updatedAt: new Date(row.updatedAt),
    };
  }
}
