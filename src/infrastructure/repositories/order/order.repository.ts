import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, QueryRunner, Repository } from 'typeorm';
import {
  CreateOrderRequest,
  LoadOrdersRequest,
  OrderListResult,
  OrderModel,
  OrderStatus,
} from '../../../domain/models/order.model';
import { IOrderRepository } from '../../../domain/repositories/order.repository.interface';
import { OrderEntity } from '../../entities/order.entity';
import { CreateOrderAction } from './createOrder/createOrder.action';
import { CreateOrderValidation } from './createOrder/createOrder.validation';
import { LoadOrdersAction } from './loadOrders/loadOrders.action';
import { LoadOrdersValidation } from './loadOrders/loadOrders.validation';
import { LoadOrderByIdAction } from './loadOrderById/loadOrderById.action';
import { LoadOrderByIdValidation } from './loadOrderById/loadOrderById.validation';
import { CancelOrderAction } from './cancelOrder/cancelOrder.action';
import { CancelOrderValidation } from './cancelOrder/cancelOrder.validation';
import { UpdateOrderStatusAction } from './updateOrderStatus/updateOrderStatus.action';
import { UpdateOrderStatusValidation } from './updateOrderStatus/updateOrderStatus.validation';

@Injectable()
export class DatabaseOrderRepository implements IOrderRepository {
  constructor(
    @InjectRepository(OrderEntity)
    private readonly orderEntity: Repository<OrderEntity>,
    private readonly dataSource: DataSource,
  ) {}

  async createOrderFromCheckout(input: CreateOrderRequest): Promise<OrderModel> {
    new CreateOrderValidation().execute(input);
    return this.runTransaction(async (session) => {
      return new CreateOrderAction(session, this.dataSource).execute(input);
    });
  }

  async loadOrders(input: LoadOrdersRequest): Promise<OrderListResult> {
    new LoadOrdersValidation().execute(input);
    return new LoadOrdersAction(this.dataSource).execute(input);
  }

  async loadOrderById(orderId: string, customerId?: string): Promise<OrderModel | null> {
    new LoadOrderByIdValidation().execute(orderId, customerId);
    return new LoadOrderByIdAction(this.dataSource).execute(orderId, customerId);
  }

  async cancelOrder(orderId: string, customerId?: string, reason?: string): Promise<OrderModel> {
    new CancelOrderValidation().execute(orderId, customerId);
    return this.runTransaction(async (session) => {
      return new CancelOrderAction(session, this.dataSource).execute(orderId, customerId, reason);
    });
  }

  async updateOrderStatus(
    orderId: string,
    status: OrderStatus,
    note?: string,
    changedBy?: string,
  ): Promise<OrderModel> {
    new UpdateOrderStatusValidation().execute(orderId, status);
    return this.runTransaction(async (session) => {
      return new UpdateOrderStatusAction(session, this.dataSource).execute(
        orderId,
        status,
        note,
        changedBy,
      );
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
