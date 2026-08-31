import { BadRequestException } from '@nestjs/common';

export class FindUserByUsernameValidation {
  execute(username: string): string {
    const normalized = username?.trim();
    if (!normalized) throw new BadRequestException('Username is required');
    return normalized;
  }
}
