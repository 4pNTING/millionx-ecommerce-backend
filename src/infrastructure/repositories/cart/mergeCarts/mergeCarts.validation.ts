import { BadRequestException } from '@nestjs/common';
import { isUUID } from 'class-validator';
import { MergeGuestCartRequest } from '../../../../domain/models/cart.model';

export class MergeCartsValidation {
  execute(input: MergeGuestCartRequest): void {
    if (!input.sessionId || input.sessionId.trim().length === 0) {
      throw new BadRequestException('Guest sessionId is required to merge carts');
    }
    if (!input.customerId || !isUUID(input.customerId)) {
      throw new BadRequestException('Valid customerId UUID is required to merge carts');
    }
  }
}
