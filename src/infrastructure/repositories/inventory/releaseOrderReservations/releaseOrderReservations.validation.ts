import { BadRequestException } from '@nestjs/common';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export class ReleaseOrderReservationsValidation {
  execute(orderId: string): void {
    if (!orderId || !UUID_REGEX.test(orderId)) {
      throw new BadRequestException('orderId must be a valid UUID');
    }
  }
}
