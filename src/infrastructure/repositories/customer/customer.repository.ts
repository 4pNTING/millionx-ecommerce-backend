import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, QueryRunner, Repository } from 'typeorm';
import {
  CreateCustomerAddressRequest,
  CustomerPageModel,
  CustomerProfileModel,
  CustomerQuery,
  UpdateCustomerAddressRequest,
  UpsertCustomerProfileRequest,
} from '../../../domain/models/customer.model';
import { ICustomerRepository } from '../../../domain/repositories/customer.repository.interface';
import { AddressEntity } from '../../entities/address.entity';
import { CustomerEntity } from '../../entities/customer.entity';
import { CreateCustomerAddressAction } from './createAddress/createAddress.action';
import { CreateCustomerAddressValidation } from './createAddress/createAddress.validation';
import { CustomerProfileMapper } from './customer-profile.mapper';
import { DeleteCustomerAddressAction } from './deleteAddress/deleteAddress.action';
import { DeleteCustomerAddressValidation } from './deleteAddress/deleteAddress.validation';
import { LoadCustomerProfileAction } from './loadProfile/loadProfile.action';
import { LoadCustomerProfileValidation } from './loadProfile/loadProfile.validation';
import { LoadCustomersAction } from './loadCustomers/loadCustomers.action';
import { LoadCustomersValidation } from './loadCustomers/loadCustomers.validation';
import { SetDefaultCustomerAddressAction } from './setDefaultAddress/setDefaultAddress.action';
import { SetDefaultCustomerAddressValidation } from './setDefaultAddress/setDefaultAddress.validation';
import { UpdateCustomerAddressAction } from './updateAddress/updateAddress.action';
import { UpdateCustomerAddressValidation } from './updateAddress/updateAddress.validation';
import { UpsertCustomerProfileAction } from './upsertProfile/upsertProfile.action';
import { UpsertCustomerProfileValidation } from './upsertProfile/upsertProfile.validation';

@Injectable()
export class DatabaseCustomerRepository implements ICustomerRepository {
  private readonly profileMapper: CustomerProfileMapper;

  constructor(
    @InjectRepository(CustomerEntity)
    private readonly customerEntity: Repository<CustomerEntity>,
    @InjectRepository(AddressEntity)
    private readonly addressEntity: Repository<AddressEntity>,
    private readonly dataSource: DataSource,
  ) {
    this.profileMapper = new CustomerProfileMapper(this.customerEntity, this.addressEntity);
  }

  async loadCustomers(filter: CustomerQuery = {}): Promise<CustomerPageModel> {
    const normalized = new LoadCustomersValidation().execute(filter);
    return new LoadCustomersAction(this.customerEntity).execute(
      normalized.filter,
      normalized.page,
      normalized.limit,
    );
  }

  async loadProfile(customerId: string): Promise<CustomerProfileModel> {
    const customer = await new LoadCustomerProfileValidation(this.customerEntity).execute(
      customerId,
    );
    return new LoadCustomerProfileAction(this.profileMapper).execute(customer);
  }

  async upsertProfile(
    customerId: string,
    input: UpsertCustomerProfileRequest,
  ): Promise<CustomerProfileModel> {
    const customer = await this.runTransaction(async (session) => {
      const validated = await new UpsertCustomerProfileValidation(
        session.manager.getRepository(CustomerEntity),
      ).execute(customerId, input);
      return new UpsertCustomerProfileAction(session).execute(validated.customer, validated.input);
    });
    return this.profileMapper.hydrate(customer);
  }

  async createAddress(
    customerId: string,
    input: CreateCustomerAddressRequest,
  ): Promise<CustomerProfileModel> {
    const updatedCustomerId = await this.runTransaction(async (session) => {
      await new CreateCustomerAddressValidation(
        session.manager.getRepository(CustomerEntity),
      ).execute(customerId);
      return new CreateCustomerAddressAction(session).execute(customerId, input);
    });
    return this.profileMapper.profileByCustomerId(updatedCustomerId);
  }

  async updateAddress(
    customerId: string,
    input: UpdateCustomerAddressRequest,
  ): Promise<CustomerProfileModel> {
    const updatedCustomerId = await this.runTransaction(async (session) => {
      const validated = await new UpdateCustomerAddressValidation(
        session.manager.getRepository(CustomerEntity),
        session.manager.getRepository(AddressEntity),
      ).execute(customerId, input);
      return new UpdateCustomerAddressAction(session).execute(validated.address, input);
    });
    return this.profileMapper.profileByCustomerId(updatedCustomerId);
  }

  async setDefaultAddress(customerId: string, addressId: string): Promise<CustomerProfileModel> {
    const updatedCustomerId = await this.runTransaction(async (session) => {
      const address = await new SetDefaultCustomerAddressValidation(
        session.manager.getRepository(CustomerEntity),
        session.manager.getRepository(AddressEntity),
      ).execute(customerId, addressId);
      return new SetDefaultCustomerAddressAction(session).execute(address);
    });
    return this.profileMapper.profileByCustomerId(updatedCustomerId);
  }

  async deleteAddress(customerId: string, addressId: string): Promise<boolean> {
    return this.runTransaction(async (session) => {
      const address = await new DeleteCustomerAddressValidation(
        session.manager.getRepository(CustomerEntity),
        session.manager.getRepository(AddressEntity),
      ).execute(customerId, addressId);
      return new DeleteCustomerAddressAction(session).execute(address);
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
