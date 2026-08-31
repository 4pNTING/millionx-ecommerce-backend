import { BadRequestException } from '@nestjs/common';

export class FindUserByIdValidation {
  execute(_id: string): string {
    const normalized = _id?.trim();
    if (!normalized) throw new BadRequestException('User id is required');
    return normalized;
  }
}
