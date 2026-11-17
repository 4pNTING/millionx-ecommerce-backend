import { BadRequestException } from '@nestjs/common';
import { LoadOrdersRequest } from '../../../../domain/models/order.model';

export class LoadOrdersValidation {
  execute(input: LoadOrdersRequest): void {
    if (input.page !== undefined && (!Number.isInteger(input.page) || input.page < 1)) {
      throw new BadRequestException('page must be an integer >= 1');
    }

    if (
      input.limit !== undefined &&
      (!Number.isInteger(input.limit) || input.limit < 1 || input.limit > 100)
    ) {
      throw new BadRequestException('limit must be an integer between 1 and 100');
    }
  }
}
