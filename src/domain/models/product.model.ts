import { AddCatalogProductImageRequest, CatalogImageModel } from './product-image.model';
import { SetCatalogProductPriceRequest } from './product-price.model';
import { CatalogVariantModel, CreateCatalogVariantRequest } from './product-variant.model';

export class ProductModel {
  id: string;
  categoryId: string;
  name: string;
  slug: string;
  description?: string;
  brand?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CatalogProductModel extends ProductModel {
  variants: CatalogVariantModel[];
  images: CatalogImageModel[];
}

export interface CatalogProductPageModel {
  items: CatalogProductModel[];
  total: number;
  page: number;
  limit: number;
}

export interface CatalogProductQuery {
  categoryId?: string;
  keyword?: string;
  currency?: string;
  page?: number;
  limit?: number;
  includeInactive?: boolean;
}

export interface CreateCatalogProductRequest {
  categoryId: string;
  name: string;
  slug: string;
  description?: string;
  brand?: string;
}

export type CreateCatalogProductBundlePriceRequest = Omit<
  SetCatalogProductPriceRequest,
  'variantId'
>;

export type CreateCatalogProductBundleImageRequest = Omit<
  AddCatalogProductImageRequest,
  'productId' | 'variantId'
>;

export interface CreateCatalogProductBundleVariantRequest extends Omit<
  CreateCatalogVariantRequest,
  'productId'
> {
  prices?: CreateCatalogProductBundlePriceRequest[];
  images?: CreateCatalogProductBundleImageRequest[];
}

export interface CreateCatalogProductBundleRequest extends CreateCatalogProductRequest {
  variants?: CreateCatalogProductBundleVariantRequest[];
  images?: CreateCatalogProductBundleImageRequest[];
}

export interface UpdateCatalogProductPriceRequest {
  id?: string;
  currency: string;
  amount: number;
  compareAtAmount?: number | null;
  startsAt?: Date | null;
  isActive?: boolean;
}

export interface UpdateCatalogProductVariantRequest {
  id?: string;
  sku: string;
  barcode?: string | null;
  name?: string | null;
  attributesJson?: string;
  isActive?: boolean;
  prices?: UpdateCatalogProductPriceRequest[];
}

export interface UpdateCatalogProductImageRequest {
  id?: string;
  variantId?: string | null;
  variantSku?: string;
  url?: string;
  altText?: string | null;
  sortOrder?: number;
}

export interface UpdateCatalogProductRequest extends Partial<CreateCatalogProductRequest> {
  id: string;
  isActive?: boolean;
  variants?: UpdateCatalogProductVariantRequest[];
  images?: UpdateCatalogProductImageRequest[];
  deleteImageIds?: string[];
}
