export class ProductImageModel {
  _id: string;
  productId: string;
  variantId?: string | null;
  url: string;
  altText?: string | null;
  sortOrder: number;
  createdAt: Date;
}

export interface CatalogImageModel {
  _id: string;
  productId: string;
  variantId?: string | null;
  url: string;
  altText?: string | null;
  sortOrder: number;
}

export interface AddCatalogProductImageRequest {
  productId: string;
  variantId?: string;
  url: string;
  altText?: string;
  sortOrder?: number;
}

export interface UpdateCatalogProductImageRequest {
  _id: string;
  variantId?: string | null;
  url?: string;
  altText?: string | null;
  sortOrder?: number;
}

export interface DeleteCatalogProductImageRequest {
  _id: string;
}
