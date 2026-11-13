import { QueryRunner, Repository } from 'typeorm';
import { CartEntity } from '../../../entities/cart.entity';
import { CartModel } from '../../../../domain/models/cart.model';

export class GetOrCreateCartAction {
  constructor(private readonly cartRepoOrRunner: Repository<CartEntity> | QueryRunner) {}

  async execute(customerId?: string, sessionId?: string): Promise<CartModel> {
    const repo =
      'manager' in this.cartRepoOrRunner && this.cartRepoOrRunner.manager
        ? this.cartRepoOrRunner.manager.getRepository(CartEntity)
        : (this.cartRepoOrRunner as Repository<CartEntity>);

    // 1. Search for existing active cart
    if (customerId) {
      const existing = await repo.findOne({
        where: { customerId, isActive: true },
      });
      if (existing) return existing;
    } else if (sessionId) {
      const existing = await repo.findOne({
        where: { sessionId, isActive: true, customerId: undefined },
      });
      if (existing) return existing;
    }

    // 2. Create new cart
    const newCart = repo.create({
      customerId: customerId || null,
      sessionId: sessionId || null,
      isActive: true,
    });

    try {
      return await repo.save(newCart);
    } catch (err: any) {
      // In case of race condition / unique constraint, reload existing active cart
      if (err.code === '23505') {
        if (customerId) {
          const cart = await repo.findOne({ where: { customerId, isActive: true } });
          if (cart) return cart;
        } else if (sessionId) {
          const cart = await repo.findOne({ where: { sessionId, isActive: true } });
          if (cart) return cart;
        }
      }
      throw err;
    }
  }
}
