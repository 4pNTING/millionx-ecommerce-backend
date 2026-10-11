import { BadRequestException } from '@nestjs/common';
import { CatalogProductQuery } from '../../../../domain/models/product.model';

export class LoadCatalogProductsValidation {
  execute(filter: CatalogProductQuery = {}): void {
    const page = filter.page;
    const limit = filter.limit;
    if (page != null && page < 1) throw new BadRequestException('page must be greater than 0');
    if (limit != null && (limit < 1 || limit > 100)) {
      throw new BadRequestException('limit must be between 1 and 100');
    }
  }
}
