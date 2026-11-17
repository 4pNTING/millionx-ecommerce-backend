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
import { ReleaseExpiredReservationsAction } from './releaseExpiredReservations/releaseExpiredReservations.action';

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
    return this.runTransaction(async (session) => {
      const expiresAt = new Date(Date.now() + expiresInMinutes * 60 * 1000);
      const [inv] = await session.manager.query(
        `SELECT _id, "onHand", reserved, available FROM ecommerce.inventory WHERE "variantId" = $1 FOR UPDATE`,
        [variantId],
      );
      if (!inv || Number(inv.available) < quantity) {
        throw new Error(`Insufficient stock for variant ${variantId}`);
      }
      const newReserved = Number(inv.reserved) + quantity;
      const newAvailable = Number(inv.onHand) - newReserved;

      await session.manager.query(
        `UPDATE ecommerce.inventory SET reserved = $1, available = $2, "updatedAt" = now() WHERE "variantId" = $3`,
        [newReserved, newAvailable, variantId],
      );
      await session.manager.query(
        `INSERT INTO ecommerce.inventory_movements ("variantId", type, quantity, "referenceType", "referenceId", note)
         VALUES ($1, 'reserved', $2, 'order', $3, 'Manual reservation')`,
        [variantId, quantity, orderId],
      );
      const [res] = await session.manager.query(
        `INSERT INTO ecommerce.inventory_reservations ("orderId", "variantId", quantity, status, "expiresAt")
         VALUES ($1, $2, $3, 'active', $4) RETURNING *`,
        [orderId, variantId, quantity, expiresAt],
      );
      return {
        _id: res._id,
        orderId: res.orderId,
        variantId: res.variantId,
        quantity: Number(res.quantity),
        status: res.status,
        expiresAt: new Date(res.expiresAt),
        createdAt: new Date(res.createdAt),
        updatedAt: new Date(res.updatedAt),
      };
    });
  }

  async releaseOrderReservations(orderId: string, reason?: string): Promise<void> {
    return this.runTransaction(async (session) => {
      const reservations = await session.manager.query(
        `SELECT _id, "variantId", quantity FROM ecommerce.inventory_reservations WHERE "orderId" = $1 AND status = 'active' FOR UPDATE`,
        [orderId],
      );
      for (const res of reservations) {
        const qty = Number(res.quantity);
        const [inv] = await session.manager.query(
          `SELECT "onHand", reserved FROM ecommerce.inventory WHERE "variantId" = $1 FOR UPDATE`,
          [res.variantId],
        );
        if (inv) {
          const newReserved = Math.max(0, Number(inv.reserved) - qty);
          const newAvailable = Number(inv.onHand) - newReserved;
          await session.manager.query(
            `UPDATE ecommerce.inventory SET reserved = $1, available = $2, "updatedAt" = now() WHERE "variantId" = $3`,
            [newReserved, newAvailable, res.variantId],
          );
          await session.manager.query(
            `INSERT INTO ecommerce.inventory_movements ("variantId", type, quantity, "referenceType", "referenceId", note)
             VALUES ($1, 'released', $2, 'order', $3, $4)`,
            [res.variantId, qty, orderId, reason || 'Released reservations'],
          );
        }
        await session.manager.query(
          `UPDATE ecommerce.inventory_reservations SET status = 'released', "updatedAt" = now() WHERE _id = $1`,
          [res._id],
        );
      }
    });
  }

  async releaseExpiredReservations(): Promise<number> {
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
