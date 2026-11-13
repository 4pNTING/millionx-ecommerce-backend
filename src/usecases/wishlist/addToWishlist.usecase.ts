import { AddToWishlistRequest } from '../../domain/models/wishlist.model';
import { IWishlistRepository } from '../../domain/repositories/wishlist.repository.interface';

export class AddToWishlistUseCase {
  constructor(private readonly wishlistRepository: IWishlistRepository) {}

  execute(input: AddToWishlistRequest) {
    return this.wishlistRepository.addToWishlist(input);
  }
}
