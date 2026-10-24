import { BadRequestException } from '@nestjs/common';
import { CatalogProductQuery } from '../../../../domain/models/product.model';
import { activeStatusValue } from '../../../common/active-status.filter';

export class LoadCatalogProductsValidation {
  execute(filter: CatalogProductQuery = {}): void {
    activeStatusValue(filter.isActive);
    if (filter.includeDescendants != null && typeof filter.includeDescendants !== 'boolean') {
      throw new BadRequestException('includeDescendants must be a boolean');
    }
    const page = filter.page;
    const limit = filter.limit;
    if (page != null && page < 1) throw new BadRequestException('page must be greater than 0');
    if (limit != null && (limit < 1 || limit > 100)) {
      throw new BadRequestException('limit must be between 1 and 100');
    }
  }
}
