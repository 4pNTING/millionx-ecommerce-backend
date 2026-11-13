export interface WishlistModel {
  _id: string;
  customerId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface WishlistItemModel {
  _id: string;
  wishlistId: string;
  productId: string;
  addedAt: Date;
}

export interface WishlistItemDetailsModel {
  _id: string;
  wishlistId: string;
  productId: string;
  productName: string;
  productSlug: string;
  brand?: string | null;
  imageUrl?: string | null;
  minPrice?: string | null;
  currency?: string | null;
  addedAt: Date;
}

export interface WishlistDetailsModel {
  _id: string;
  customerId: string;
  items: WishlistItemDetailsModel[];
  createdAt: Date;
  updatedAt: Date;
}

export interface AddToWishlistRequest {
  customerId: string;
  productId: string;
}

export interface RemoveFromWishlistRequest {
  customerId: string;
  productId: string;
}
