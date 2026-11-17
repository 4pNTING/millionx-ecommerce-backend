import { BadRequestException } from '@nestjs/common';

export class ReserveStockValidation {
  execute(orderId: string, variantId: string, quantity: number): void {
    if (!orderId) {
      throw new BadRequestException('orderId is required');
    }
    if (!variantId) {
      throw new BadRequestException('variantId is required');
    }
    if (!Number.isInteger(quantity) || quantity <= 0) {
      throw new BadRequestException('quantity must be an integer greater than 0');
    }
  }
}
