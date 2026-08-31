import { ICustomerRepository } from '../../domain/repositories/customer.repository.interface';

export class DeleteCustomerAddressUseCase {
  constructor(private readonly repository: ICustomerRepository) {}
  execute(customerId: string, addressId: string) {
    return this.repository.deleteAddress(customerId, addressId);
  }
}
