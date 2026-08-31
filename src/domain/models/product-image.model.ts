export class ProductImageModel {
  id: string;
  productId: string;
  variantId?: string;
  url: string;
  altText?: string;
  sortOrder: number;
  createdAt: Date;
}

export interface CatalogImageModel {
  id: string;
  productId: string;
  variantId?: string;
  url: string;
  altText?: string;
  sortOrder: number;
}

export interface AddCatalogProductImageRequest {
  productId: string;
  variantId?: string;
  url: string;
  altText?: string;
  sortOrder?: number;
}
