import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, QueryRunner, Repository } from 'typeorm';
import {
  AdjustStockRequest,
  InventoryModel,
  InventoryReservationModel,
} from '../../../domain/models/inventory.model';
import { IInventoryRepository } from '../../../domain/repositories/inventory.repository.interface';
import { InventoryEntity } from '../../entities/inventory.entity';
import { GetInventoryAction } from './getInventory/getInventory.action';
import { GetInventoryValidation } from './getInventory/getInventory.validation';
import { AdjustStockAction } from './adjustStock/adjustStock.action';
import { AdjustStockValidation } from './adjustStock/adjustStock.validation';
import { ReserveStockAction } from './reserveStock/reserveStock.action';
import { ReserveStockValidation } from './reserveStock/reserveStock.validation';
import { ReleaseOrderReservationsAction } from './releaseOrderReservations/releaseOrderReservations.action';
import { ReleaseOrderReservationsValidation } from './releaseOrderReservations/releaseOrderReservations.validation';
import { ReleaseExpiredReservationsAction } from './releaseExpiredReservations/releaseExpiredReservations.action';
import { ReleaseExpiredReservationsValidation } from './releaseExpiredReservations/releaseExpiredReservations.validation';

@Injectable()
export class DatabaseInventoryRepository implements IInventoryRepository {
  constructor(
    @InjectRepository(InventoryEntity)
    private readonly inventoryEntity: Repository<InventoryEntity>,
    private readonly dataSource: DataSource,
  ) {}

  async getInventory(variantId: string): Promise<InventoryModel | null> {
    new GetInventoryValidation().execute(variantId);
    return new GetInventoryAction(this.dataSource).execute(variantId);
  }

  async adjustStock(input: AdjustStockRequest): Promise<InventoryModel> {
    new AdjustStockValidation().execute(input);
    return this.runTransaction(async (session) => {
      return new AdjustStockAction(session).execute(input);
    });
  }

  async reserveStock(
    orderId: string,
    variantId: string,
    quantity: number,
    expiresInMinutes = 30,
  ): Promise<InventoryReservationModel> {
    new ReserveStockValidation().execute(orderId, variantId, quantity);
    return this.runTransaction(async (session) => {
      return new ReserveStockAction(session).execute(
        orderId,
        variantId,
        quantity,
        expiresInMinutes,
      );
    });
  }

  async releaseOrderReservations(orderId: string, reason?: string): Promise<void> {
    new ReleaseOrderReservationsValidation().execute(orderId);
    return this.runTransaction(async (session) => {
      return new ReleaseOrderReservationsAction(session).execute(orderId, reason);
    });
  }

  async releaseExpiredReservations(): Promise<number> {
    new ReleaseExpiredReservationsValidation().execute();
    return this.runTransaction(async (session) => {
      return new ReleaseExpiredReservationsAction(session).execute();
    });
  }

  private async runTransaction<T>(work: (session: QueryRunner) => Promise<T>): Promise<T> {
    const session = this.dataSource.createQueryRunner();
    await session.connect();
    await session.startTransaction();
    try {
      const result = await work(session);
      await session.commitTransaction();
      return result;
    } catch (error) {
      await session.rollbackTransaction();
      throw error;
    } finally {
      await session.release();
    }
  }
}
