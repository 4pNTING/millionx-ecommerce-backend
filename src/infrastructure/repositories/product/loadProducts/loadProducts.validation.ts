import { BadRequestException } from '@nestjs/common';
import { CatalogProductQuery } from '../../../../domain/models/product.model';

export interface NormalizedCatalogProductQuery {
  filter: CatalogProductQuery;
  page: number;
  limit: number;
  currency?: string;
  cacheKey: CatalogProductQuery;
}

export class LoadCatalogProductsValidation {
  execute(filter: CatalogProductQuery): NormalizedCatalogProductQuery {
    const page = filter.page ?? 1;
    const limit = filter.limit ?? 20;
    if (page < 1) throw new BadRequestException('page must be greater than 0');
    if (limit < 1 || limit > 100) {
      throw new BadRequestException('limit must be between 1 and 100');
    }
    const currency = filter.currency?.trim().toUpperCase();
    return {
      filter,
      page,
      limit,
      currency,
      cacheKey: { ...filter, page, limit, currency },
    };
  }
}
