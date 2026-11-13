import { NotFoundException } from '@nestjs/common';
import { QueryRunner } from 'typeorm';
import { CartDetailsModel, UpdateCartItemRequest } from '../../../../domain/models/cart.model';
import { CartEntity } from '../../../entities/cart.entity';
import { CartItemEntity } from '../../../entities/cart-item.entity';
import { CartDetailsMapper } from '../cart-details.mapper';

export class UpdateCartItemAction {
  constructor(
    private readonly session: QueryRunner,
    private readonly mapper: CartDetailsMapper,
  ) {}

  async execute(input: UpdateCartItemRequest): Promise<CartDetailsModel> {
    const cartRepo = this.session.manager.getRepository(CartEntity);
    const cartItemRepo = this.session.manager.getRepository(CartItemEntity);

    const item = await cartItemRepo.findOne({ where: { _id: input.cartItemId } });
    if (!item) {
      throw new NotFoundException(`Cart item ${input.cartItemId} not found`);
    }

    const cart = await cartRepo.findOne({ where: { _id: item.cartId } });
    if (!cart || !cart.isActive) {
      throw new NotFoundException(`Active cart not found for item ${input.cartItemId}`);
    }

    // Verify ownership
    if (input.customerId && cart.customerId !== input.customerId) {
      throw new NotFoundException(`Cart item not found in customer cart`);
    } else if (!input.customerId && input.sessionId && cart.sessionId !== input.sessionId) {
      throw new NotFoundException(`Cart item not found in session cart`);
    }

    if (input.quantity <= 0) {
      await cartItemRepo.remove(item);
    } else {
      item.quantity = input.quantity;
      await cartItemRepo.save(item);
    }

    return this.mapper.hydrateCart(cart);
  }
}
