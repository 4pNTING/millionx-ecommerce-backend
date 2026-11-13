import { BadRequestException } from '@nestjs/common';
import { CreateCheckoutSessionRequest } from '../../../../domain/models/checkout-session.model';

export class CreateCheckoutSessionValidation {
  execute(input: CreateCheckoutSessionRequest): void {
    if (!input.cartId && !input.customerId && !input.sessionId) {
      throw new BadRequestException('At least one of cartId, customerId, or sessionId is required');
    }
  }
}
