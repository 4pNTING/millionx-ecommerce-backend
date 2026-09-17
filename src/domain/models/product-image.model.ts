export class ProductImageModel {
  id: string;
  productId: string;
  variantId?: string | null;
  url: string;
  altText?: string | null;
  sortOrder: number;
  createdAt: Date;
}

export interface CatalogImageModel {
  id: string;
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
  id: string;
  variantId?: string | null;
  url?: string;
  altText?: string | null;
  sortOrder?: number;
}

export interface DeleteCatalogProductImageRequest {
  id: string;
}
