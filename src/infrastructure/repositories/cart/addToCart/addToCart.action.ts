import { NotFoundException, BadRequestException } from '@nestjs/common';
import { QueryRunner } from 'typeorm';
import { AddToCartRequest, CartDetailsModel } from '../../../../domain/models/cart.model';
import { CartEntity } from '../../../entities/cart.entity';
import { CartItemEntity } from '../../../entities/cart-item.entity';
import { ProductVariantEntity } from '../../../entities/product-variant.entity';
import { ProductEntity } from '../../../entities/product.entity';
import { CartDetailsMapper } from '../cart-details.mapper';
import { GetOrCreateCartAction } from '../getOrCreateCart/getOrCreateCart.action';

export class AddToCartAction {
  constructor(
    private readonly session: QueryRunner,
    private readonly mapper: CartDetailsMapper,
  ) {}

  async execute(input: AddToCartRequest): Promise<CartDetailsModel> {
    const variantRepo = this.session.manager.getRepository(ProductVariantEntity);
    const productRepo = this.session.manager.getRepository(ProductEntity);
    const cartItemRepo = this.session.manager.getRepository(CartItemEntity);

    // 1. Verify variant exists and is active
    const variant = await variantRepo.findOne({ where: { _id: input.variantId } });
    if (!variant || !variant.isActive) {
      throw new NotFoundException(`Product variant ${input.variantId} not found or inactive`);
    }

    // 2. Verify parent product exists and is active
    const product = await productRepo.findOne({ where: { _id: variant.productId } });
    if (!product || !product.isActive) {
      throw new BadRequestException(`Product for variant ${input.variantId} is inactive`);
    }

    // 3. Get or create active cart
    const cart = await new GetOrCreateCartAction(this.session).execute(
      input.customerId,
      input.sessionId,
    );

    // 4. Check if item already exists in cart
    const existingItem = await cartItemRepo.findOne({
      where: { cartId: cart._id, variantId: input.variantId },
    });

    if (existingItem) {
      existingItem.quantity += input.quantity;
      await cartItemRepo.save(existingItem);
    } else {
      const newItem = cartItemRepo.create({
        cartId: cart._id,
        variantId: input.variantId,
        quantity: input.quantity,
      });
      await cartItemRepo.save(newItem);
    }

    // 5. Return updated and hydrated cart
    return this.mapper.hydrateCart(cart);
  }
}
