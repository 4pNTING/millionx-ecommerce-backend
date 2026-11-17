import { BadRequestException } from '@nestjs/common';
import { LoadOrdersRequest } from '../../../../domain/models/order.model';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export class LoadOrdersValidation {
  execute(input: LoadOrdersRequest): void {
    if (input.customerId && !UUID_REGEX.test(input.customerId)) {
      throw new BadRequestException('customerId must be a valid UUID');
    }

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
