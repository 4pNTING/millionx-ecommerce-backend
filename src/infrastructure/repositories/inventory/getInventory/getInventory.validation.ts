import { BadRequestException } from '@nestjs/common';

export class GetInventoryValidation {
  execute(variantId: string): void {
    if (!variantId) {
      throw new BadRequestException('variantId is required');
    }
  }
}
