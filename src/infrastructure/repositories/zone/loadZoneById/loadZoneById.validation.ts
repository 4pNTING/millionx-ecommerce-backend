import { BadRequestException } from '@nestjs/common';
import { LoadZoneByIdRequest } from '../../../../domain/models/zone.model';

export class LoadZoneByIdValidation {
  execute(input: LoadZoneByIdRequest): void {
    if (!input?._id) throw new BadRequestException('Zone id is required');
  }
}
