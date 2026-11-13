export interface PriceSnapshotItemModel {
  variantId: string;
  sku: string;
  productId: string;
  productName: string;
  variantName?: string | null;
  quantity: number;
  unitPrice: string;
  compareAtPrice?: string | null;
  currency: string;
  subtotal: string;
}

export interface CheckoutSessionModel {
  _id: string;
  cartId: string;
  customerId?: string | null;
  subtotal: string;
  discountAmount: string;
  shippingAmount: string;
  taxAmount: string;
  total: string;
  currency: string;
  priceSnapshot: PriceSnapshotItemModel[];
  status: 'open' | 'completed' | 'expired' | 'abandoned';
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateCheckoutSessionRequest {
  cartId?: string;
  customerId?: string;
  sessionId?: string;
  shippingAmount?: string;
  taxAmount?: string;
  discountAmount?: string;
}
