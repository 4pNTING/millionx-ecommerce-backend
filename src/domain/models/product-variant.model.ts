import { CatalogPriceModel } from './product-price.model';

export class ProductVariantModel {
  _id: string;
  productId: string;
  sku: string;
  barcode?: string | null;
  name?: string | null;
  attributes: Record<string, unknown>;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CatalogVariantModel {
  _id: string;
  productId: string;
  sku: string;
  barcode?: string | null;
  name?: string | null;
  attributesJson: string;
  isActive: boolean;
  prices: CatalogPriceModel[];
}

export interface CreateCatalogVariantRequest {
  productId: string;
  sku: string;
  barcode?: string;
  name?: string;
  attributesJson?: string;
}
