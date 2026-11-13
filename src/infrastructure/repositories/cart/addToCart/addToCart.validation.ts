import { BadRequestException } from '@nestjs/common';
import { isUUID } from 'class-validator';
import { AddToCartRequest } from '../../../../domain/models/cart.model';

export class AddToCartValidation {
  execute(input: AddToCartRequest): void {
    if (!input.customerId && !input.sessionId) {
      throw new BadRequestException('Either customerId or sessionId must be provided');
    }
    if (!input.variantId || !isUUID(input.variantId)) {
      throw new BadRequestException('Valid variantId UUID is required');
    }
    if (!input.quantity || input.quantity < 1) {
      throw new BadRequestException('Quantity must be at least 1');
    }
  }
}
