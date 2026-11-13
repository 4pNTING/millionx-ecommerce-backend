import { BadRequestException } from '@nestjs/common';

export class GetOrCreateCartValidation {
  execute(customerId?: string, sessionId?: string): void {
    if (!customerId && !sessionId) {
      throw new BadRequestException('Either customerId or sessionId must be provided for a cart');
    }
  }
}
