import { Repository } from 'typeorm';
import { LoadZoneByIdResponse } from '../../../../domain/models/zone.model';
import { ZoneEntity } from '../../../entities/zone.entity';

export class FindZoneByNameAction {
  constructor(private readonly repository: Repository<ZoneEntity>) {}

  async execute(name: string): Promise<LoadZoneByIdResponse | null> {
    return this.repository.findOne({ where: { name } });
  }
}
