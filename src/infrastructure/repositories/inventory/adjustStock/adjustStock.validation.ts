import { BadRequestException } from '@nestjs/common';
import { AdjustStockRequest } from '../../../../domain/models/inventory.model';

const VALID_TYPES = ['inbound', 'outbound', 'reserved', 'released', 'adjustment'];
const VALID_REF_TYPES = ['order', 'purchase_order', 'manual_adjustment', 'reservation_release'];

export class AdjustStockValidation {
  execute(input: AdjustStockRequest): void {
    if (!input) {
      throw new BadRequestException('Adjust stock input is required');
    }

    if (!input.variantId) {
      throw new BadRequestException('variantId is required');
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
