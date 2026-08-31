import { ICustomerRepository } from '../../domain/repositories/customer.repository.interface';

export class SetDefaultCustomerAddressUseCase {
  constructor(private readonly repository: ICustomerRepository) {}
  execute(customerId: string, addressId: string) {
    return this.repository.setDefaultAddress(customerId, addressId);
  }
}
