import { BadRequestException } from '@nestjs/common';

export class CancelOrderValidation {
  execute(orderId: string, customerId?: string): void {
    if (!orderId) {
      throw new BadRequestException('orderId is required');
    }

    if (customerId !== undefined && !customerId) {
      throw new BadRequestException('customerId is required');
    }
  }
}
