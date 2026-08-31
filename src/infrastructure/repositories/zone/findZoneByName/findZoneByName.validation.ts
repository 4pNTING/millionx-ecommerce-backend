import { BadRequestException } from '@nestjs/common';

export class FindZoneByNameValidation {
  execute(name: string): string {
    const normalized = name?.trim();
    if (!normalized) throw new BadRequestException('Zone name is required');
    return normalized;
  }
}
