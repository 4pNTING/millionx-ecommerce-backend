export class ProductPriceModel {
  id: string;
  variantId: string;
  currency: string;
  amount: string;
  compareAtAmount?: string | null;
  startsAt?: Date | null;
  endsAt?: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CatalogPriceModel {
  id: string;
  variantId: string;
  currency: string;
  amount: number;
  compareAtAmount?: number | null;
  startsAt?: Date | null;
  endsAt?: Date;
  isActive: boolean;
}

export interface SetCatalogProductPriceRequest {
  variantId: string;
  currency: string;
  amount: number;
  compareAtAmount?: number;
  startsAt?: Date;
}
