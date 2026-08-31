import { UpsertCustomerProfileRequest } from '../../domain/models/customer.model';
import { ICustomerRepository } from '../../domain/repositories/customer.repository.interface';

export class UpsertCustomerProfileUseCase {
  constructor(private readonly repository: ICustomerRepository) {}
  execute(customerId: string, input: UpsertCustomerProfileRequest) {
    return this.repository.upsertProfile(customerId, input);
  }
}
