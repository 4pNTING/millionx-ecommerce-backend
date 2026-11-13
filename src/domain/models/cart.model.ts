export interface CartModel {
  _id: string;
  customerId?: string | null;
  sessionId?: string | null;
  isActive: boolean;
  mergedIntoCartId?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CartItemModel {
  _id: string;
  cartId: string;
  variantId: string;
  quantity: number;
  addedAt: Date;
  updatedAt: Date;
}

export interface CartItemDetailsModel {
  _id: string;
  cartId: string;
  variantId: string;
  quantity: number;
  addedAt: Date;
  updatedAt: Date;
  sku: string;
  variantName?: string | null;
  attributes?: Record<string, unknown>;
  productId: string;
  productName: string;
  productSlug: string;
  imageUrl?: string | null;
  unitPrice?: string;
  compareAtPrice?: string | null;
  currency?: string;
  lineTotal?: string;
}

export interface CartDetailsModel {
  _id: string;
  customerId?: string | null;
  sessionId?: string | null;
  isActive: boolean;
  totalItems: number;
  subtotal: string;
  currency: string;
  items: CartItemDetailsModel[];
  createdAt: Date;
  updatedAt: Date;
}

export interface AddToCartRequest {
  variantId: string;
  quantity: number;
  customerId?: string;
  sessionId?: string;
}

export interface UpdateCartItemRequest {
  cartItemId: string;
  quantity: number;
  customerId?: string;
  sessionId?: string;
}

export interface RemoveCartItemRequest {
  cartItemId: string;
  customerId?: string;
  sessionId?: string;
}

export interface MergeGuestCartRequest {
  sessionId: string;
  customerId: string;
}
