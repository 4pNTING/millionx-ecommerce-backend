import { BadRequestException } from '@nestjs/common';
import { CustomerQuery } from '../../../../domain/models/customer.model';

export interface NormalizedCustomerQuery {
  filter: CustomerQuery;
  page: number;
  limit: number;
}

export class LoadCustomersValidation {
  execute(filter: CustomerQuery = {}): NormalizedCustomerQuery {
    const page = filter.page ?? 1;
    const limit = filter.limit ?? 20;

    if (page < 1) throw new BadRequestException('page must be greater than 0');
    if (limit < 1 || limit > 100) {
      throw new BadRequestException('limit must be between 1 and 100');
    }

    const keyword = filter.keyword?.trim();
    return {
      filter: { ...filter, keyword: keyword || undefined, page, limit },
      page,
      limit,
    };
  }
}
