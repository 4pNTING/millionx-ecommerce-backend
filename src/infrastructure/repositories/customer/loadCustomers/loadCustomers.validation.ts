import { BadRequestException } from '@nestjs/common';
import { CustomerQuery } from '../../../../domain/models/customer.model';

export class LoadCustomersValidation {
  execute(query: CustomerQuery = {}): void {
    const page = query.page;
    const limit = query.limit;

    if (page != null && page < 1) throw new BadRequestException('page must be greater than 0');
    if (limit != null && (limit < 1 || limit > 100)) {
      throw new BadRequestException('limit must be between 1 and 100');
    }
  }
}
