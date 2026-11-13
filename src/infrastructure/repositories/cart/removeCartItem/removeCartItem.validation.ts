import { BadRequestException } from '@nestjs/common';
import { isUUID } from 'class-validator';
import { RemoveCartItemRequest } from '../../../../domain/models/cart.model';

export class RemoveCartItemValidation {
  execute(input: RemoveCartItemRequest): void {
    if (!input.cartItemId || !isUUID(input.cartItemId)) {
      throw new BadRequestException('Valid cartItemId UUID is required');
    }
  }
}
