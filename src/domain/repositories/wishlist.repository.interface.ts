import {
  AddToWishlistRequest,
  RemoveFromWishlistRequest,
  WishlistDetailsModel,
} from '../models/wishlist.model';

export interface IWishlistRepository {
  loadWishlist(customerId: string): Promise<WishlistDetailsModel>;
  addToWishlist(input: AddToWishlistRequest): Promise<WishlistDetailsModel>;
  removeFromWishlist(input: RemoveFromWishlistRequest): Promise<WishlistDetailsModel>;
}
