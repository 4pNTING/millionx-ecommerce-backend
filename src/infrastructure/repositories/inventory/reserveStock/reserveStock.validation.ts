import { BadRequestException } from '@nestjs/common';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export class ReserveStockValidation {
  execute(orderId: string, variantId: string, quantity: number): void {
    if (!orderId || !UUID_REGEX.test(orderId)) {
      throw new BadRequestException('orderId must be a valid UUID');
    }
    if (!variantId || !UUID_REGEX.test(variantId)) {
      throw new BadRequestException('variantId must be a valid UUID');
    }
    if (!Number.isInteger(quantity) || quantity <= 0) {
      throw new BadRequestException('quantity must be an integer greater than 0');
    }
  }
}
