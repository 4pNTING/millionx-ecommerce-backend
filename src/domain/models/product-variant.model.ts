import { CatalogPriceModel } from './product-price.model';

export class ProductVariantModel {
  id: string;
  productId: string;
  sku: string;
  barcode?: string;
  name?: string;
  attributes: Record<string, unknown>;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CatalogVariantModel {
  id: string;
  productId: string;
  sku: string;
  barcode?: string;
  name?: string;
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
