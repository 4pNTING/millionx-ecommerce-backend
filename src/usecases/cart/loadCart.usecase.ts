import { ICartRepository } from '../../domain/repositories/cart.repository.interface';

export class LoadCartUseCase {
  constructor(private readonly cartRepository: ICartRepository) {}

  execute(customerId?: string, sessionId?: string) {
    return this.cartRepository.loadCart(customerId, sessionId);
  }
}
