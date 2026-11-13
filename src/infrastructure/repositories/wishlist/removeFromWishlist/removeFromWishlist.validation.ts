import { BadRequestException } from '@nestjs/common';
import { isUUID } from 'class-validator';
import { RemoveFromWishlistRequest } from '../../../../domain/models/wishlist.model';

export class RemoveFromWishlistValidation {
  execute(input: RemoveFromWishlistRequest): void {
    if (!input.customerId || !isUUID(input.customerId)) {
      throw new BadRequestException('Valid customerId UUID is required');
    }
    if (!input.productId || !isUUID(input.productId)) {
      throw new BadRequestException('Valid productId UUID is required');
    }
  }
}
