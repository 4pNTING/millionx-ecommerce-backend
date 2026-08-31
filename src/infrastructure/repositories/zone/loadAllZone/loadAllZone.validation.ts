import { BadRequestException } from '@nestjs/common';
import { QueryProps } from '../../../../domain/models/query.model';

export class LoadAllZoneValidation {
  execute(query: QueryProps): void {
    const page = query.paginate?.page;
    const limit = query.paginate?.limit;
    if (page != null && page < 1) throw new BadRequestException('page must be greater than 0');
    if (limit != null && (limit < 1 || limit > 500)) {
      throw new BadRequestException('limit must be between 1 and 500');
    }
  }
}
