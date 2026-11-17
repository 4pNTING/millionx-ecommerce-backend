import { BadRequestException } from '@nestjs/common';
import { AdjustStockRequest } from '../../../../domain/models/inventory.model';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const VALID_TYPES = ['inbound', 'outbound', 'reserved', 'released', 'adjustment'];
const VALID_REF_TYPES = ['order', 'purchase_order', 'manual_adjustment', 'reservation_release'];

export class AdjustStockValidation {
  execute(input: AdjustStockRequest): void {
    if (!input) {
      throw new BadRequestException('Adjust stock input is required');
    }

    if (!input.variantId || !UUID_REGEX.test(input.variantId)) {
      throw new BadRequestException('variantId must be a valid UUID');
    }

    if (!Number.isInteger(input.quantityDelta) || input.quantityDelta === 0) {
      throw new BadRequestException('quantityDelta must be a non-zero integer');
    }

    if (!input.type || !VALID_TYPES.includes(input.type)) {
      throw new BadRequestException(`type must be one of: ${VALID_TYPES.join(', ')}`);
    }

    if (!input.referenceType || !VALID_REF_TYPES.includes(input.referenceType)) {
      throw new BadRequestException(
        `referenceType must be one of: ${VALID_REF_TYPES.join(', ')}`,
      );
    }
  }
}
