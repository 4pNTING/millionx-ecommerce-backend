import { BadRequestException } from '@nestjs/common';

export interface NormalizedCustomerIdentifier {
  email: string;
  phone: string;
}

export class FindCustomerByIdentifierValidation {
  execute(identifier: string): NormalizedCustomerIdentifier {
    const phone = identifier?.trim();
    if (!phone) throw new BadRequestException('Customer identifier is required');
    return { email: phone.toLowerCase(), phone };
  }
}
