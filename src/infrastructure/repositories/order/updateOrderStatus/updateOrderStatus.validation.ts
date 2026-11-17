import { BadRequestException } from '@nestjs/common';
import { OrderStatus } from '../../../../domain/models/order.model';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const VALID_STATUSES: OrderStatus[] = [
  'pending',
  'confirmed',
  'processing',
  'completed',
  'cancelled',
];

export class UpdateOrderStatusValidation {
  execute(orderId: string, status: OrderStatus): void {
    if (!orderId || !UUID_REGEX.test(orderId)) {
      throw new BadRequestException('orderId must be a valid UUID');
    }

    if (!status || !VALID_STATUSES.includes(status)) {
      throw new BadRequestException(
        `status must be one of: ${VALID_STATUSES.join(', ')}`,
      );
    }
  }
}
