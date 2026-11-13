import { QueryRunner } from 'typeorm';
import { CartDetailsModel, MergeGuestCartRequest } from '../../../../domain/models/cart.model';
import { CartEntity } from '../../../entities/cart.entity';
import { CartItemEntity } from '../../../entities/cart-item.entity';
import { CartDetailsMapper } from '../cart-details.mapper';
import { GetOrCreateCartAction } from '../getOrCreateCart/getOrCreateCart.action';

export class MergeCartsAction {
  constructor(
    private readonly session: QueryRunner,
    private readonly mapper: CartDetailsMapper,
  ) {}

  async execute(input: MergeGuestCartRequest): Promise<CartDetailsModel> {
    const cartRepo = this.session.manager.getRepository(CartEntity);
    const cartItemRepo = this.session.manager.getRepository(CartItemEntity);

    // 1. Get member cart
    const memberCart = await new GetOrCreateCartAction(this.session).execute(input.customerId);

    // 2. Find active guest cart
    const guestCart = await cartRepo.findOne({
      where: {
        sessionId: input.sessionId,
        isActive: true,
        customerId: undefined,
      },
    });

    if (!guestCart || guestCart._id === memberCart._id) {
      return this.mapper.hydrateCart(memberCart, this.session);
    }

    // 3. Find all items in guest cart
    const guestItems = await cartItemRepo.find({
      where: { cartId: guestCart._id },
    });

    if (guestItems.length > 0) {
      // Find existing member items
      const memberItems = await cartItemRepo.find({
        where: { cartId: memberCart._id },
      });
      const memberItemMap = new Map<string, CartItemEntity>();
      for (const item of memberItems) {
        memberItemMap.set(item.variantId, item);
      }

      for (const guestItem of guestItems) {
        const existing = memberItemMap.get(guestItem.variantId);
        if (existing) {
          existing.quantity += guestItem.quantity;
          await cartItemRepo.save(existing);
        } else {
          const newItem = cartItemRepo.create({
            cartId: memberCart._id,
            variantId: guestItem.variantId,
            quantity: guestItem.quantity,
          });
          await cartItemRepo.save(newItem);
        }
      }

      // Delete guest cart items
      await cartItemRepo.delete({ cartId: guestCart._id });
    }

    // 4. Mark guest cart as inactive and merged
    guestCart.isActive = false;
    guestCart.mergedIntoCartId = memberCart._id;
    await cartRepo.save(guestCart);

    // 5. Return updated member cart
    return this.mapper.hydrateCart(memberCart, this.session);
  }
}
