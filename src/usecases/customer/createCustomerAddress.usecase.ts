import { CreateCustomerAddressRequest } from '../../domain/models/customer.model';
import { ICustomerRepository } from '../../domain/repositories/customer.repository.interface';

export class CreateCustomerAddressUseCase {
  constructor(private readonly repository: ICustomerRepository) {}
  execute(customerId: string, input: CreateCustomerAddressRequest) {
    return this.repository.createAddress(customerId, input);
  }
}
