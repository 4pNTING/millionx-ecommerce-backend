import { CustomerQuery } from '../../domain/models/customer.model';
import { ICustomerRepository } from '../../domain/repositories/customer.repository.interface';

export class LoadCustomersUseCase {
  constructor(private readonly repository: ICustomerRepository) {}

  execute(query?: CustomerQuery) {
    return this.repository.loadCustomers(query);
  }
}
