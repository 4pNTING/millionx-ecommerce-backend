import { AddToCartRequest } from '../../domain/models/cart.model';
import { ICartRepository } from '../../domain/repositories/cart.repository.interface';

export class AddToCartUseCase {
  constructor(private readonly cartRepository: ICartRepository) {}

  execute(input: AddToCartRequest) {
    return this.cartRepository.addToCart(input);
  }
}
