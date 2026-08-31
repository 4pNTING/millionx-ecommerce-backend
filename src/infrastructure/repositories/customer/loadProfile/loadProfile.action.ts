import { CustomerProfileModel } from '../../../../domain/models/customer.model';
import { CustomerEntity } from '../../../entities/customer.entity';
import { CustomerProfileMapper } from '../customer-profile.mapper';

export class LoadCustomerProfileAction {
  constructor(private readonly mapper: CustomerProfileMapper) {}

  execute(customer: CustomerEntity): Promise<CustomerProfileModel> {
    return this.mapper.hydrate(customer);
  }
}
