import { ICartRepository } from '../../domain/repositories/cart.repository.interface';

export class GetOrCreateCartUseCase {
  constructor(private readonly cartRepository: ICartRepository) {}

  execute(customerId?: string, sessionId?: string) {
    return this.cartRepository.getOrCreateCart(customerId, sessionId);
  }
}
