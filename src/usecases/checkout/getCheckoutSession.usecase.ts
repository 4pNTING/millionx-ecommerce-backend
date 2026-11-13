import { ICheckoutRepository } from '../../domain/repositories/checkout.repository.interface';

export class GetCheckoutSessionUseCase {
  constructor(private readonly checkoutRepository: ICheckoutRepository) {}

  execute(sessionId: string, customerId?: string) {
    return this.checkoutRepository.getCheckoutSession(sessionId, customerId);
  }
}
