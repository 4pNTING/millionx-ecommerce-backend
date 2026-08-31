import { QueryRunner } from 'typeorm';
import { CreateCustomerAddressRequest } from '../../../../domain/models/customer.model';
import { AddressEntity } from '../../../entities/address.entity';
import { CustomerAddressHelper } from '../customer-address.helper';

export class CreateCustomerAddressAction {
  constructor(private readonly session: QueryRunner) {}

  async execute(customerId: string, input: CreateCustomerAddressRequest): Promise<string> {
    const repository = this.session.manager.getRepository(AddressEntity);
    const count = await repository.count({ where: { customerId } });
    const isDefault = count === 0 || input.isDefault === true;
    if (isDefault) await CustomerAddressHelper.clearDefault(customerId, this.session.manager);
    await repository.save(
      repository.create({
        ...input,
        customerId,
        countryCode: (input.countryCode ?? 'LA').toUpperCase(),
        latitude: input.latitude == null ? undefined : input.latitude.toString(),
        longitude: input.longitude == null ? undefined : input.longitude.toString(),
        isDefault,
      }),
    );
    return customerId;
  }
}
