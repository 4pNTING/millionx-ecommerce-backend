import { BadRequestException } from '@nestjs/common';
import { isUUID } from 'class-validator';

export class FindCustomerByAccountIdValidation {
  execute(accountId: string): string {
    const normalized = accountId?.trim();
    if (!normalized || !isUUID(normalized, '4')) {
      throw new BadRequestException('Customer account id must be a UUID v4');
    }
    return normalized;
  }
}
