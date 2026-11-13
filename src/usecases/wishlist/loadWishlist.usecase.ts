import { IWishlistRepository } from '../../domain/repositories/wishlist.repository.interface';

export class LoadWishlistUseCase {
  constructor(private readonly wishlistRepository: IWishlistRepository) {}

  execute(customerId: string) {
    return this.wishlistRepository.loadWishlist(customerId);
  }
}
