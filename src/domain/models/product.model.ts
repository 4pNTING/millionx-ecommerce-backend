import { CatalogImageModel } from './product-image.model';
import { CatalogVariantModel } from './product-variant.model';

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

export interface UpdateCatalogProductRequest extends Partial<CreateCatalogProductRequest> {
  id: string;
  isActive?: boolean;
}
