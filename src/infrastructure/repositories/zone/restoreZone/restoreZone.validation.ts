import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { ZoneEntity } from '../../../entities/zone.entity';

export class RestoreZoneValidation {
  constructor(private readonly repository: Repository<ZoneEntity>) {}

  async execute(_id: string): Promise<void> {
    if (!_id) throw new BadRequestException('Zone id is required');
    const zone = await this.repository.findOne({ where: { _id }, withDeleted: true });
    if (!zone) throw new NotFoundException('Zone not found');
  }
}
