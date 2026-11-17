import { BadRequestException } from '@nestjs/common';

export class FindOrderByOrderNumberValidation {
  execute(orderNumber: string): void {
    if (!orderNumber || typeof orderNumber !== 'string' || !orderNumber.trim()) {
      throw new BadRequestException('orderNumber must be a non-empty string');
    }
  }
}
