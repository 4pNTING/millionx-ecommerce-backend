import {
  AddToCartRequest,
  CartDetailsModel,
  CartModel,
  MergeGuestCartRequest,
  RemoveCartItemRequest,
  UpdateCartItemRequest,
} from '../models/cart.model';

export interface ICartRepository {
  getOrCreateCart(customerId?: string, sessionId?: string): Promise<CartModel>;
  loadCart(customerId?: string, sessionId?: string): Promise<CartDetailsModel | null>;
  addToCart(input: AddToCartRequest): Promise<CartDetailsModel>;
  updateCartItem(input: UpdateCartItemRequest): Promise<CartDetailsModel>;
  removeCartItem(input: RemoveCartItemRequest): Promise<CartDetailsModel>;
  clearCart(customerId?: string, sessionId?: string): Promise<boolean>;
  mergeGuestCart(input: MergeGuestCartRequest): Promise<CartDetailsModel>;
}
