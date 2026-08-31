import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { Not, Repository } from 'typeorm';
import { UpdateZoneRequest } from '../../../../domain/models/zone.model';
import { ZoneEntity } from '../../../entities/zone.entity';

export class UpdateZoneValidation {
  constructor(private readonly repository: Repository<ZoneEntity>) {}

  async execute(input: UpdateZoneRequest): Promise<void> {
    if (!input._id) throw new BadRequestException('Zone id is required');
    const zone = await this.repository.findOne({ where: { _id: input._id } });
    if (!zone) throw new NotFoundException('Zone not found');
    if (input.name) {
      const duplicate = await this.repository.findOne({
        where: { name: input.name.trim(), _id: Not(input._id) },
        withDeleted: true,
      });
      if (duplicate) throw new ConflictException('Zone name already exists');
    }
  }
}
