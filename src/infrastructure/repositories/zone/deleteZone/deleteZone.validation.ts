import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { DeleteZoneRequest } from '../../../../domain/models/zone.model';
import { ZoneEntity } from '../../../entities/zone.entity';

export class DeleteZoneValidation {
  constructor(private readonly repository: Repository<ZoneEntity>) {}

  async execute(input: DeleteZoneRequest): Promise<void> {
    if (!input._id) throw new BadRequestException('Zone id is required');
    const zone = await this.repository.findOne({ where: { _id: input._id } });
    if (!zone) throw new NotFoundException('Zone not found');
  }
}
