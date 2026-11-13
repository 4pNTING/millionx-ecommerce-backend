import { QueryRunner } from 'typeorm';
import {
  RemoveFromWishlistRequest,
  WishlistDetailsModel,
} from '../../../../domain/models/wishlist.model';
import { WishlistEntity } from '../../../entities/wishlist.entity';
import { WishlistItemEntity } from '../../../entities/wishlist-item.entity';
import { WishlistDetailsMapper } from '../wishlist-details.mapper';

export class RemoveFromWishlistAction {
  constructor(
    private readonly session: QueryRunner,
    private readonly mapper: WishlistDetailsMapper,
  ) {}

  async execute(input: RemoveFromWishlistRequest): Promise<WishlistDetailsModel> {
    const wishlistRepo = this.session.manager.getRepository(WishlistEntity);
    const wishlistItemRepo = this.session.manager.getRepository(WishlistItemEntity);

    let wishlist = await wishlistRepo.findOne({ where: { customerId: input.customerId } });
    if (!wishlist) {
      const created = wishlistRepo.create({ customerId: input.customerId });
      wishlist = await wishlistRepo.save(created);
      return this.mapper.hydrateWishlist(wishlist);
    }

    // Delete item by productId in customer's wishlist
    await wishlistItemRepo.delete({
      wishlistId: wishlist._id,
      productId: input.productId,
    });

    return this.mapper.hydrateWishlist(wishlist);
  }
}
