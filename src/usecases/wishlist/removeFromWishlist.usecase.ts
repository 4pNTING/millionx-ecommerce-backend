import { RemoveFromWishlistRequest } from '../../domain/models/wishlist.model';
import { IWishlistRepository } from '../../domain/repositories/wishlist.repository.interface';

export class RemoveFromWishlistUseCase {
  constructor(private readonly wishlistRepository: IWishlistRepository) {}

  execute(input: RemoveFromWishlistRequest) {
    return this.wishlistRepository.removeFromWishlist(input);
  }
}
