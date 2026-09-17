import { BadRequestException, ConflictException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, QueryRunner, Repository } from 'typeorm';
import {
  CustomerAccountLoginRecord,
  RegisterCustomerRequest,
  RegisteredCustomerAccount,
} from '../../../domain/models/customer-auth.model';
import { ICustomerAuthRepository } from '../../../domain/repositories/customer-auth.repository.interface';
import { CustomerAccountEntity } from '../../entities/customer-account.entity';
import { CustomerEntity } from '../../entities/customer.entity';
import { FindCustomerByIdentifierAction } from './findByIdentifier/findByIdentifier.action';
import { FindCustomerByIdentifierValidation } from './findByIdentifier/findByIdentifier.validation';
import { FindCustomerByAccountIdAction } from './findByAccountId/findByAccountId.action';
import { FindCustomerByAccountIdValidation } from './findByAccountId/findByAccountId.validation';
import { MarkCustomerLoginAction } from './markLogin/markLogin.action';
import { MarkCustomerLoginValidation } from './markLogin/markLogin.validation';
import { RegisterCustomerAction } from './registerCustomer/registerCustomer.action';
import { RegisterCustomerValidation } from './registerCustomer/registerCustomer.validation';

@Injectable()
export class DatabaseCustomerAuthRepository implements ICustomerAuthRepository {
  constructor(
    @InjectRepository(CustomerAccountEntity)
    private readonly accountRepository: Repository<CustomerAccountEntity>,
    @InjectRepository(CustomerEntity)
    private readonly customerRepository: Repository<CustomerEntity>,
    private readonly dataSource: DataSource,
  ) {}

  async register(
    input: RegisterCustomerRequest,
    passwordHash: string,
  ): Promise<RegisteredCustomerAccount> {
    try {
      return await this.runTransaction(async (session) => {
        const validated = await new RegisterCustomerValidation(session).execute(input);
        return new RegisterCustomerAction(session).execute(input, passwordHash, validated);
      });
    } catch (error: any) {
      if (error instanceof BadRequestException || error instanceof ConflictException) throw error;
      if (error?.code === '23505') {
        throw new ConflictException('Email, phone or customer account already exists');
      }
      throw error;
    }
  }

  async findByIdentifier(identifier: string): Promise<CustomerAccountLoginRecord | null> {
    const normalized = new FindCustomerByIdentifierValidation().execute(identifier);
    return new FindCustomerByIdentifierAction(
      this.customerRepository,
      this.accountRepository,
    ).execute(normalized);
  }

  async findByAccountId(accountId: string): Promise<CustomerAccountLoginRecord | null> {
    const normalized = new FindCustomerByAccountIdValidation().execute(accountId);
    return new FindCustomerByAccountIdAction(
      this.customerRepository,
      this.accountRepository,
    ).execute(normalized);
  }

  async markLogin(accountId: string): Promise<void> {
    const account = await new MarkCustomerLoginValidation(this.accountRepository).execute(
      accountId,
    );
    await new MarkCustomerLoginAction(this.accountRepository).execute(account);
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
