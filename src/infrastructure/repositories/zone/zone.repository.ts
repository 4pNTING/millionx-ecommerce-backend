import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { ZoneEntity } from '../../entities/zone.entity';
import { IZoneRepository } from '../../../domain/repositories/zone.repository.interface';
import {
  CreateZoneRequest,
  CreateZoneResponse,
  UpdateZoneRequest,
  DeleteZoneRequest,
  LoadAllZoneResponse,
  LoadZoneByIdRequest,
  LoadZoneByIdResponse,
} from '../../../domain/models/zone.model';
import { QueryProps } from '../../../domain/models/query.model';

import { CreateZoneAction } from './createZone/createZone.action';
import { CreateZoneValidation } from './createZone/createZone.validation';
import { UpdateZoneAction } from './updateZone/updateZone.action';
import { UpdateZoneValidation } from './updateZone/updateZone.validation';
import { DeleteZoneAction } from './deleteZone/deleteZone.action';
import { DeleteZoneValidation } from './deleteZone/deleteZone.validation';
import { RestoreZoneAction } from './restoreZone/restoreZone.action';
import { RestoreZoneValidation } from './restoreZone/restoreZone.validation';
import { LoadAllZoneAction } from './loadAllZone/loadAllZone.action';
import { LoadAllZoneValidation } from './loadAllZone/loadAllZone.validation';
import { LoadZoneByIdAction } from './loadZoneById/loadZoneById.action';
import { LoadZoneByIdValidation } from './loadZoneById/loadZoneById.validation';
import { FindZoneByNameAction } from './findZoneByName/findZoneByName.action';
import { FindZoneByNameValidation } from './findZoneByName/findZoneByName.validation';

// Redis Cache
import { RedisService } from '../../cache/redis.service';
import { CacheKeys } from '../../cache/cache-keys.constants';

@Injectable()
export class DatabaseZoneRepository implements IZoneRepository {
  constructor(
    @InjectRepository(ZoneEntity)
    private readonly zoneEntityRepository: Repository<ZoneEntity>,
    private readonly dataSource: DataSource,
    private readonly redisService: RedisService,
  ) {}

  async create(params: CreateZoneRequest): Promise<CreateZoneResponse> {
    const session = this.dataSource.createQueryRunner();
    await session.connect();
    await session.startTransaction();
    try {
      await new CreateZoneValidation(this.zoneEntityRepository).execute(params);
      const result = await new CreateZoneAction(session).execute(params);
      await session.commitTransaction();

      // Invalidate all paginated list caches
      await this.redisService.delByPattern(CacheKeys.ZONE_LIST_PATTERN);

      return result;
    } catch (error) {
      await session.rollbackTransaction();
      throw error;
    } finally {
      await session.release();
    }
  }

  async update(params: UpdateZoneRequest): Promise<void> {
    const session = this.dataSource.createQueryRunner();
    await session.connect();
    await session.startTransaction();
    try {
      await new UpdateZoneValidation(this.zoneEntityRepository).execute(params);
      await new UpdateZoneAction(session).execute(params);
      await session.commitTransaction();

      // Invalidate all paginated list caches และ cache ของ item นี้
      await this.redisService.delByPattern(CacheKeys.ZONE_LIST_PATTERN);
      if (params._id) {
        await this.redisService.del(CacheKeys.ZONE_BY_ID(params._id));
      }
    } catch (error) {
      await session.rollbackTransaction();
      throw error;
    } finally {
      await session.release();
    }
  }

  async delete(params: DeleteZoneRequest): Promise<void> {
    const session = this.dataSource.createQueryRunner();
    await session.connect();
    await session.startTransaction();
    try {
      await new DeleteZoneValidation(this.zoneEntityRepository).execute(params);
      await new DeleteZoneAction(session).execute(params._id);
      await session.commitTransaction();

      // Invalidate all paginated list caches และ cache ของ item นี้
      await this.redisService.delByPattern(CacheKeys.ZONE_LIST_PATTERN);
      await this.redisService.del(CacheKeys.ZONE_BY_ID(params._id));
    } catch (error) {
      await session.rollbackTransaction();
      throw error;
    } finally {
      await session.release();
    }
  }

  async restore(_id: string): Promise<void> {
    const session = this.dataSource.createQueryRunner();
    await session.connect();
    await session.startTransaction();
    try {
      await new RestoreZoneValidation(this.zoneEntityRepository).execute(_id);
      await new RestoreZoneAction(session).execute(_id);
      await session.commitTransaction();

      // Invalidate all paginated list caches และ cache ของ item นี้
      await this.redisService.delByPattern(CacheKeys.ZONE_LIST_PATTERN);
      await this.redisService.del(CacheKeys.ZONE_BY_ID(_id));
    } catch (error) {
      await session.rollbackTransaction();
      throw error;
    } finally {
      await session.release();
    }
  }

  async findAll(query: QueryProps): Promise<LoadAllZoneResponse> {
    new LoadAllZoneValidation().execute(query);
    // Cache-Aside: ลองอ่านจาก cache ก่อน (ใช้ key ที่รวม query params เพื่อแยก cache แต่ละ pagination/filter)
    const cacheKey = CacheKeys.ZONE_LIST_QUERY(query);
    const cached = await this.redisService.get<LoadAllZoneResponse>(cacheKey);
    if (cached) return cached;

    // Cache MISS → query จาก Database
    const session = this.dataSource.createQueryRunner();
    await session.connect();
    try {
      const result = await new LoadAllZoneAction(session).execute(query);

      // บันทึกผลลง cache
      await this.redisService.set(cacheKey, result);

      return result;
    } finally {
      await session.release();
    }
  }

  async findById(params: LoadZoneByIdRequest): Promise<LoadZoneByIdResponse | null> {
    // Cache-Aside: ลองอ่านจาก cache ก่อน
    const cached = await this.redisService.get<LoadZoneByIdResponse>(
      CacheKeys.ZONE_BY_ID(params._id),
    );
    if (cached) return cached;

    // Cache MISS → query จาก Database
    const session = this.dataSource.createQueryRunner();
    await session.connect();
    try {
      new LoadZoneByIdValidation().execute(params);
      const result = await new LoadZoneByIdAction(session).execute(params);

      // บันทึกลง cache (ถ้ามีข้อมูล)
      if (result) {
        await this.redisService.set(CacheKeys.ZONE_BY_ID(params._id), result);
      }

      return result;
    } finally {
      await session.release();
    }
  }

  async findByName(name: string): Promise<LoadZoneByIdResponse | null> {
    const normalized = new FindZoneByNameValidation().execute(name);
    return new FindZoneByNameAction(this.zoneEntityRepository).execute(normalized);
  }
}
