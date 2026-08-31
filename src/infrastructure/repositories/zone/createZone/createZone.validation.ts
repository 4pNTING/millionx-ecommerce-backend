import { BadRequestException, ConflictException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { CreateZoneRequest } from '../../../../domain/models/zone.model';
import { ZoneEntity } from '../../../entities/zone.entity';

export class CreateZoneValidation {
  constructor(private readonly repository: Repository<ZoneEntity>) {}

  async execute(input: CreateZoneRequest): Promise<void> {
    if (!input.name?.trim()) throw new BadRequestException('Zone name is required');
    const duplicate = await this.repository.findOne({
      where: { name: input.name.trim() },
      withDeleted: true,
    });
    if (duplicate) throw new ConflictException('Zone name already exists');
  }
}
