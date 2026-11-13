import { Repository } from 'typeorm';
import { WishlistDetailsModel } from '../../../../domain/models/wishlist.model';
import { WishlistEntity } from '../../../entities/wishlist.entity';
import { WishlistDetailsMapper } from '../wishlist-details.mapper';

export class LoadWishlistAction {
  constructor(
    private readonly wishlistRepo: Repository<WishlistEntity>,
    private readonly mapper: WishlistDetailsMapper,
  ) {}

  async execute(customerId: string): Promise<WishlistDetailsModel> {
    let wishlist = await this.wishlistRepo.findOne({ where: { customerId } });
    if (!wishlist) {
      const created = this.wishlistRepo.create({ customerId });
      try {
        wishlist = await this.wishlistRepo.save(created);
      } catch (err: any) {
        if (err.code === '23505') {
          wishlist = await this.wishlistRepo.findOne({ where: { customerId } });
        }
        if (!wishlist) throw err;
      }
    }

    return this.mapper.hydrateWishlist(wishlist);
  }
}
