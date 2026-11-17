export interface InventoryModel {
  _id: string;
  variantId: string;
  onHand: number;
  reserved: number;
  available: number;
  updatedAt: Date;
}

export type InventoryMovementType =
  | 'inbound'
  | 'outbound'
  | 'reserved'
  | 'released'
  | 'adjustment';

export type InventoryMovementReferenceType =
  | 'order'
  | 'purchase_order'
  | 'manual_adjustment'
  | 'reservation_release';

export interface InventoryMovementModel {
  _id: string;
  variantId: string;
  type: InventoryMovementType;
  quantity: number;
  referenceType: InventoryMovementReferenceType;
  referenceId?: string | null;
  note?: string | null;
  createdAt: Date;
}

export type InventoryReservationStatus =
  | 'active'
  | 'consumed'
  | 'released'
  | 'expired';

export interface InventoryReservationModel {
  _id: string;
  orderId: string;
  variantId: string;
  quantity: number;
  status: InventoryReservationStatus;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface AdjustStockRequest {
  variantId: string;
  quantityDelta: number;
  type: InventoryMovementType;
  referenceType: InventoryMovementReferenceType;
  referenceId?: string;
  note?: string;
}
