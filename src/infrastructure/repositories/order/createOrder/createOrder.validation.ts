import { BadRequestException } from '@nestjs/common';
import { CreateOrderRequest } from '../../../../domain/models/order.model';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export class CreateOrderValidation {
  execute(input: CreateOrderRequest): void {
    if (!input) {
      throw new BadRequestException('Order input is required');
    }

    if (!input.customerId || !UUID_REGEX.test(input.customerId)) {
      throw new BadRequestException('customerId must be a valid UUID');
    }

    if (!input.checkoutSessionId || !UUID_REGEX.test(input.checkoutSessionId)) {
      throw new BadRequestException('checkoutSessionId must be a valid UUID');
    }

    if (!input.shippingAddress || typeof input.shippingAddress !== 'object') {
      throw new BadRequestException('shippingAddress object is required');
    }

    const { recipientName, phone, addressLine1 } = input.shippingAddress;
    if (!recipientName || typeof recipientName !== 'string' || !recipientName.trim()) {
      throw new BadRequestException('shippingAddress.recipientName is required');
    }

    if (!phone || typeof phone !== 'string' || !phone.trim()) {
      throw new BadRequestException('shippingAddress.phone is required');
    }

    if (!addressLine1 || typeof addressLine1 !== 'string' || !addressLine1.trim()) {
      throw new BadRequestException('shippingAddress.addressLine1 is required');
    }
  }
}
