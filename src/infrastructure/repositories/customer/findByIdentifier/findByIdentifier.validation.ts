import { BadRequestException } from '@nestjs/common';
import { normalizePhoneNumber } from '../../../common/phone.util';

export interface NormalizedCustomerIdentifier {
  email: string;
  phone: string;
}

export class FindCustomerByIdentifierValidation {
  execute(identifier: string): NormalizedCustomerIdentifier {
    const raw = identifier?.trim();
    if (!raw) throw new BadRequestException('Customer identifier is required');
    const normalizedPhone = normalizePhoneNumber(raw);
    return { email: raw.toLowerCase(), phone: normalizedPhone || raw };
  }
}
