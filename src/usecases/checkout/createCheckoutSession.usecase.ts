import { CreateCheckoutSessionRequest } from '../../domain/models/checkout-session.model';
import { ICheckoutRepository } from '../../domain/repositories/checkout.repository.interface';

export class CreateCheckoutSessionUseCase {
  constructor(private readonly checkoutRepository: ICheckoutRepository) {}

  execute(input: CreateCheckoutSessionRequest) {
    return this.checkoutRepository.createCheckoutSession(input);
  }
}
