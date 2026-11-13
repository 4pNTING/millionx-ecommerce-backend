import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, QueryRunner, Repository } from 'typeorm';
import {
  CheckoutSessionModel,
  CreateCheckoutSessionRequest,
} from '../../../domain/models/checkout-session.model';
import { ICheckoutRepository } from '../../../domain/repositories/checkout.repository.interface';
import { CheckoutSessionEntity } from '../../entities/checkout-session.entity';
import { CreateCheckoutSessionAction } from './createCheckoutSession/createCheckoutSession.action';
import { CreateCheckoutSessionValidation } from './createCheckoutSession/createCheckoutSession.validation';
import { GetCheckoutSessionAction } from './getCheckoutSession/getCheckoutSession.action';

@Injectable()
export class DatabaseCheckoutRepository implements ICheckoutRepository {
  constructor(
    @InjectRepository(CheckoutSessionEntity)
    private readonly checkoutEntity: Repository<CheckoutSessionEntity>,
    private readonly dataSource: DataSource,
  ) {}

  async createCheckoutSession(input: CreateCheckoutSessionRequest): Promise<CheckoutSessionModel> {
    new CreateCheckoutSessionValidation().execute(input);
    return this.runTransaction(async (session) => {
      return new CreateCheckoutSessionAction(session, this.dataSource).execute(input);
    });
  }

  async getCheckoutSession(
    sessionId: string,
    customerId?: string,
  ): Promise<CheckoutSessionModel | null> {
    return new GetCheckoutSessionAction(this.checkoutEntity).execute(sessionId, customerId);
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
