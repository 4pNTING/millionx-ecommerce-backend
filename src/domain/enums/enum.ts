import { registerEnumType } from '@nestjs/graphql';

export enum Role {
  MANAGER = 'manager',
  ADMIN = 'admin',
  STAFF = 'staff',
}

export enum ActiveStatus {
  active = 'active',
  inactive = 'inactive',
  all = 'all',
}

registerEnumType(ActiveStatus, {
  name: 'ActiveStatus',
  description: 'Filter for active, inactive, or all items',
});

// ─── Social Provider ──────────────────────────────────────
export enum SocialProvider {
  GOOGLE = 'GOOGLE',
  FACEBOOK = 'FACEBOOK',
}

registerEnumType(SocialProvider, {
  name: 'SocialProvider',
  description: 'Supported social login providers',
});

// ─── Order Status ─────────────────────────────────────────
export enum OrderStatus {
  pending = 'pending',
  confirmed = 'confirmed',
  processing = 'processing',
  completed = 'completed',
  cancelled = 'cancelled',
}

registerEnumType(OrderStatus, {
  name: 'OrderStatus',
  description: 'Lifecycle status of a customer order',
});

// ─── Inventory Movement Type ──────────────────────────────
export enum InventoryMovementType {
  inbound = 'inbound',
  outbound = 'outbound',
  reserved = 'reserved',
  released = 'released',
  adjustment = 'adjustment',
}

registerEnumType(InventoryMovementType, {
  name: 'InventoryMovementType',
  description: 'Type of inventory movement: inbound, outbound, reserved, released, or adjustment',
});

// ─── Inventory Movement Reference Type ────────────────────
export enum InventoryMovementReferenceType {
  order = 'order',
  purchase_order = 'purchase_order',
  manual_adjustment = 'manual_adjustment',
  reservation_release = 'reservation_release',
}

registerEnumType(InventoryMovementReferenceType, {
  name: 'InventoryMovementReferenceType',
  description: 'Reference source for inventory movement',
});

// ─── Inventory Reservation Status ─────────────────────────
export enum InventoryReservationStatus {
  active = 'active',
  consumed = 'consumed',
  released = 'released',
  expired = 'expired',
}

registerEnumType(InventoryReservationStatus, {
  name: 'InventoryReservationStatus',
  description: 'Status of an inventory reservation: active, consumed, released, or expired',
});

// ─── Checkout Session Status ──────────────────────────────
export enum CheckoutSessionStatus {
  open = 'open',
  completed = 'completed',
  expired = 'expired',
  abandoned = 'abandoned',
}

registerEnumType(CheckoutSessionStatus, {
  name: 'CheckoutSessionStatus',
  description: 'Status of a checkout session: open, completed, expired, or abandoned',
});

// ─── Table Status ─────────────────────────────────────────
export enum TableStatus {
  available = 'available', // ว่าง
  occupied = 'occupied', // มีลูกค้า
  reserved = 'reserved', // จอง
  bill = 'bill', // รอชำระเงิน
}

registerEnumType(TableStatus, {
  name: 'TableStatus',
  description: 'Status of a restaurant table',
});

// ─── Payment Method ───────────────────────────────────────
export enum PaymentMethod {
  cash = 'cash', // เงินสด
  card = 'card', // บัตรเครดิต/เดบิต
  qr = 'qr', // QR Code
  wallet = 'wallet', // e-Wallet
}

registerEnumType(PaymentMethod, {
  name: 'PaymentMethod',
  description: 'Payment method used for an order',
});

// ─── Attachment Status ────────────────────────────────────
export enum AttachmentStatus {
  pending = 'pending', // อยู่ในคิวประมวลผล
  processing = 'processing', // กำลังประมวลผล
  completed = 'completed', // ประมวลผลเสร็จสมบูรณ์
  failed = 'failed', // ประมวลผลล้มเหลว
}

registerEnumType(AttachmentStatus, {
  name: 'AttachmentStatus',
  description: 'Status of file attachment processing',
});
