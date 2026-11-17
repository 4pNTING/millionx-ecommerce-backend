export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'processing'
  | 'completed'
  | 'cancelled';

export interface OrderShippingAddress {
  recipientName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city?: string;
  stateProvince?: string;
  postalCode?: string;
  country?: string;
}

export interface OrderItemModel {
  _id: string;
  orderId: string;
  variantId: string;
  sku: string;
  productName: string;
  variantName: string;
  quantity: number;
  unitPrice: string;
  subtotal: string;
  createdAt: Date;
}

export interface OrderStatusHistoryModel {
  _id: string;
  orderId: string;
  fromStatus?: string | null;
  toStatus: string;
  note?: string | null;
  createdBy: string;
  createdAt: Date;
}

export interface OrderModel {
  _id: string;
  orderNumber: string;
  customerId: string;
  checkoutSessionId?: string | null;
  subtotal: string;
  discountAmount: string;
  shippingAmount: string;
  taxAmount: string;
  total: string;
  currency: string;
  status: OrderStatus;
  shippingAddress: OrderShippingAddress;
  billingAddress?: OrderShippingAddress | null;
  notes?: string | null;
  items?: OrderItemModel[];
  statusHistory?: OrderStatusHistoryModel[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateOrderRequest {
  customerId: string;
  checkoutSessionId: string;
  shippingAddress: OrderShippingAddress;
  billingAddress?: OrderShippingAddress;
  notes?: string;
}

export interface LoadOrdersRequest {
  customerId?: string;
  status?: string;
  page?: number;
  limit?: number;
}

export interface OrderListResult {
  items: OrderModel[];
  total: number;
  page: number;
  limit: number;
}
