import { QueryRunner } from 'typeorm';
import { AddressEntity } from '../../../entities/address.entity';
import { CustomerAddressHelper } from '../customer-address.helper';

export class SetDefaultCustomerAddressAction {
  constructor(private readonly session: QueryRunner) {}

  async execute(address: AddressEntity): Promise<string> {
    await CustomerAddressHelper.clearDefault(address.customerId, this.session.manager);
    address.isDefault = true;
    await this.session.manager.getRepository(AddressEntity).save(address);
    return address.customerId;
  }
}
