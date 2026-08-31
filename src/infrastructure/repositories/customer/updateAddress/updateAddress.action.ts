import { QueryRunner } from 'typeorm';
import { UpdateCustomerAddressRequest } from '../../../../domain/models/customer.model';
import { AddressEntity } from '../../../entities/address.entity';
import { CustomerAddressHelper } from '../customer-address.helper';

export class UpdateCustomerAddressAction {
  constructor(private readonly session: QueryRunner) {}

  async execute(address: AddressEntity, input: UpdateCustomerAddressRequest): Promise<string> {
    if (input.isDefault === true) {
      await CustomerAddressHelper.clearDefault(address.customerId, this.session.manager);
    }
    const { id: _id, latitude, longitude, countryCode, ...rest } = input;
    Object.assign(address, rest);
    if (countryCode) address.countryCode = countryCode.toUpperCase();
    if (latitude != null) address.latitude = latitude.toString();
    if (longitude != null) address.longitude = longitude.toString();
    await this.session.manager.getRepository(AddressEntity).save(address);
    return address.customerId;
  }
}
