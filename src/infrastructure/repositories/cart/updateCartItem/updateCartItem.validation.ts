import { BadRequestException } from '@nestjs/common';
import { isUUID } from 'class-validator';
import { UpdateCartItemRequest } from '../../../../domain/models/cart.model';

export class UpdateCartItemValidation {
  execute(input: UpdateCartItemRequest): void {
    if (!input.cartItemId || !isUUID(input.cartItemId)) {
      throw new BadRequestException('Valid cartItemId UUID is required');
    }
    if (input.quantity === undefined || input.quantity === null || input.quantity < 0) {
      throw new BadRequestException('Quantity must be 0 or greater');
    }
  }
}
