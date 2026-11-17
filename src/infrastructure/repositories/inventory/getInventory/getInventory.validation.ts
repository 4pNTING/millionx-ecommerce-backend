import { BadRequestException } from '@nestjs/common';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export class GetInventoryValidation {
  execute(variantId: string): void {
    if (!variantId || !UUID_REGEX.test(variantId)) {
      throw new BadRequestException('variantId must be a valid UUID');
    }
  }
}
