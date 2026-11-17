import { BadRequestException } from '@nestjs/common';
import { CreateOrderRequest } from '../../../../domain/models/order.model';

export class CreateOrderValidation {
  execute(input: CreateOrderRequest): void {
    if (!input) {
      throw new BadRequestException('Order input is required');
    }

    if (!input.customerId) {
      throw new BadRequestException('customerId is required');
    }

    if (!input.checkoutSessionId) {
      throw new BadRequestException('checkoutSessionId is required');
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
