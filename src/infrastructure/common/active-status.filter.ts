import { BadRequestException } from '@nestjs/common';
import { ActiveStatus } from '../../domain/enums/enum';

/** `all` is a filter instruction, never a value written to a Boolean column. */
export function activeStatusValue(
  status: ActiveStatus | null | undefined,
  fallback: ActiveStatus = ActiveStatus.active,
): boolean | undefined {
  switch (status ?? fallback) {
    case ActiveStatus.active:
      return true;
    case ActiveStatus.inactive:
      return false;
    case ActiveStatus.all:
      return undefined;
    default:
      throw new BadRequestException('isActive must be active, inactive, or all');
  }
}
