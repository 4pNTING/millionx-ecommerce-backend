import { UpdateCartItemRequest } from '../../domain/models/cart.model';
import { ICartRepository } from '../../domain/repositories/cart.repository.interface';

export class UpdateCartItemUseCase {
  constructor(private readonly cartRepository: ICartRepository) {}

  execute(input: UpdateCartItemRequest) {
    return this.cartRepository.updateCartItem(input);
  }
}
