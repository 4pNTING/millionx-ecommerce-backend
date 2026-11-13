import { QueryRunner } from 'typeorm';
import { CartEntity } from '../../../entities/cart.entity';
import { CartItemEntity } from '../../../entities/cart-item.entity';

export class ClearCartAction {
  constructor(private readonly session: QueryRunner) {}

  async execute(customerId?: string, sessionId?: string): Promise<boolean> {
    if (!customerId && !sessionId) return false;

    const cartRepo = this.session.manager.getRepository(CartEntity);
    const cartItemRepo = this.session.manager.getRepository(CartItemEntity);

    let cart: CartEntity | null = null;
    if (customerId) {
      cart = await cartRepo.findOne({ where: { customerId, isActive: true } });
    } else if (sessionId) {
      cart = await cartRepo.findOne({
        where: { sessionId, isActive: true, customerId: undefined },
      });
    }

    if (!cart) return false;

    await cartItemRepo.delete({ cartId: cart._id });
    return true;
  }
}
