import { BadRequestException } from '@nestjs/common';

export class ReleaseOrderReservationsValidation {
  execute(orderId: string): void {
    if (!orderId) {
      throw new BadRequestException('orderId is required');
    }
  }
}
