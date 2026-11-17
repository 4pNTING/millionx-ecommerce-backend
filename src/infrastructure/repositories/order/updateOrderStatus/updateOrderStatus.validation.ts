import { BadRequestException } from '@nestjs/common';
import { OrderStatus } from '../../../../domain/models/order.model';

const VALID_STATUSES: OrderStatus[] = [
  OrderStatus.pending,
  OrderStatus.confirmed,
  OrderStatus.processing,
  OrderStatus.completed,
  OrderStatus.cancelled,
];

export class UpdateOrderStatusValidation {
  execute(orderId: string, status: OrderStatus): void {
    if (!orderId) {
      throw new BadRequestException('orderId is required');
    }

    if (!status || !VALID_STATUSES.includes(status)) {
      throw new BadRequestException(
        `status must be one of: ${VALID_STATUSES.join(', ')}`,
      );
    }
  }
}
