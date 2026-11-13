import { Repository } from 'typeorm';
import { CartEntity } from '../../../entities/cart.entity';
import { CartDetailsModel } from '../../../../domain/models/cart.model';
import { CartDetailsMapper } from '../cart-details.mapper';

export class LoadCartAction {
  constructor(
    private readonly cartRepo: Repository<CartEntity>,
    private readonly mapper: CartDetailsMapper,
  ) {}

  async execute(customerId?: string, sessionId?: string): Promise<CartDetailsModel | null> {
    if (!customerId && !sessionId) return null;

    let cart: CartEntity | null = null;
    if (customerId) {
      cart = await this.cartRepo.findOne({
        where: { customerId, isActive: true },
      });
    } else if (sessionId) {
      cart = await this.cartRepo.findOne({
        where: { sessionId, isActive: true, customerId: undefined },
      });
    }

    if (!cart) return null;
    return this.mapper.hydrateCart(cart);
  }
}
