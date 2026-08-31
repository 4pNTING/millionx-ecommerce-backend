import { ICustomerRepository } from '../../domain/repositories/customer.repository.interface';

export class LoadCustomerProfileUseCase {
  constructor(private readonly repository: ICustomerRepository) {}
  execute(customerId: string) {
    return this.repository.loadProfile(customerId);
  }
}
