import { RemoveCartItemRequest } from '../../domain/models/cart.model';
import { ICartRepository } from '../../domain/repositories/cart.repository.interface';

export class RemoveCartItemUseCase {
  constructor(private readonly cartRepository: ICartRepository) {}

  execute(input: RemoveCartItemRequest) {
    return this.cartRepository.removeCartItem(input);
  }
}
