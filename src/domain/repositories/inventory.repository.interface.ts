import {
  AdjustStockRequest,
  InventoryModel,
  InventoryReservationModel,
} from '../models/inventory.model';

export interface IInventoryRepository {
  getInventory(variantId: string): Promise<InventoryModel | null>;
  adjustStock(input: AdjustStockRequest): Promise<InventoryModel>;
  reserveStock(
    orderId: string,
    variantId: string,
    quantity: number,
    expiresInMinutes?: number,
  ): Promise<InventoryReservationModel>;
  releaseOrderReservations(orderId: string, reason?: string): Promise<void>;
  releaseExpiredReservations(): Promise<number>;
}
