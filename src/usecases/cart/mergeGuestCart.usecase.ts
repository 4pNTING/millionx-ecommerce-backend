import { MergeGuestCartRequest } from '../../domain/models/cart.model';
import { ICartRepository } from '../../domain/repositories/cart.repository.interface';

export class MergeGuestCartUseCase {
  constructor(private readonly cartRepository: ICartRepository) {}

  execute(input: MergeGuestCartRequest) {
    return this.cartRepository.mergeGuestCart(input);
  }
}
