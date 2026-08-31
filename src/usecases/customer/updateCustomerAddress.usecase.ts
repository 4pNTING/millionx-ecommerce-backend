import { UpdateCustomerAddressRequest } from '../../domain/models/customer.model';
import { ICustomerRepository } from '../../domain/repositories/customer.repository.interface';

export class UpdateCustomerAddressUseCase {
  constructor(private readonly repository: ICustomerRepository) {}
  execute(customerId: string, input: UpdateCustomerAddressRequest) {
    return this.repository.updateAddress(customerId, input);
  }
}
