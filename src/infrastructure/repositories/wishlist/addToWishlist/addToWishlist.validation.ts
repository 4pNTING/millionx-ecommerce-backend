import { BadRequestException } from '@nestjs/common';
import { isUUID } from 'class-validator';
import { AddToWishlistRequest } from '../../../../domain/models/wishlist.model';

export class AddToWishlistValidation {
  execute(input: AddToWishlistRequest): void {
    if (!input.customerId || !isUUID(input.customerId)) {
      throw new BadRequestException('Valid customerId UUID is required');
    }
    if (!input.productId || !isUUID(input.productId)) {
      throw new BadRequestException('Valid productId UUID is required');
    }
  }
}
