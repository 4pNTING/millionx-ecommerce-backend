import { BadRequestException, NotFoundException } from '@nestjs/common';
import { QueryRunner } from 'typeorm';
import {
  AddToWishlistRequest,
  WishlistDetailsModel,
} from '../../../../domain/models/wishlist.model';
import { ProductEntity } from '../../../entities/product.entity';
import { WishlistEntity } from '../../../entities/wishlist.entity';
import { WishlistItemEntity } from '../../../entities/wishlist-item.entity';
import { WishlistDetailsMapper } from '../wishlist-details.mapper';

export class AddToWishlistAction {
  constructor(
    private readonly session: QueryRunner,
    private readonly mapper: WishlistDetailsMapper,
  ) {}

  async execute(input: AddToWishlistRequest): Promise<WishlistDetailsModel> {
    const productRepo = this.session.manager.getRepository(ProductEntity);
    const wishlistRepo = this.session.manager.getRepository(WishlistEntity);
    const wishlistItemRepo = this.session.manager.getRepository(WishlistItemEntity);

    // 1. Verify product exists and is active
    const product = await productRepo.findOne({ where: { _id: input.productId } });
    if (!product || !product.isActive) {
      throw new NotFoundException(`Product ${input.productId} not found or inactive`);
    }

    // 2. Get or create wishlist for customer
    let wishlist = await wishlistRepo.findOne({ where: { customerId: input.customerId } });
    if (!wishlist) {
      const created = wishlistRepo.create({ customerId: input.customerId });
      try {
        wishlist = await wishlistRepo.save(created);
      } catch (err: any) {
        if (err.code === '23505') {
          wishlist = await wishlistRepo.findOne({ where: { customerId: input.customerId } });
        }
        if (!wishlist) throw err;
      }
    }

    // 3. Check if product already in wishlist
    const existing = await wishlistItemRepo.findOne({
      where: { wishlistId: wishlist._id, productId: input.productId },
    });

    if (!existing) {
      const item = wishlistItemRepo.create({
        wishlistId: wishlist._id,
        productId: input.productId,
      });
      await wishlistItemRepo.save(item);
    }

    return this.mapper.hydrateWishlist(wishlist, this.session);
  }
}
