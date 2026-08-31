import { QueryRunner } from 'typeorm';
import { UpsertCustomerProfileRequest } from '../../../../domain/models/customer.model';
import { CustomerEntity } from '../../../entities/customer.entity';

export class UpsertCustomerProfileAction {
  constructor(private readonly session: QueryRunner) {}

  async execute(
    customer: CustomerEntity,
    input: UpsertCustomerProfileRequest,
  ): Promise<CustomerEntity> {
    Object.assign(customer, input);
    return this.session.manager.getRepository(CustomerEntity).save(customer);
  }
}
