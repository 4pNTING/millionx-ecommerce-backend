import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, QueryRunner, Repository } from 'typeorm';
import {
  AddToCartRequest,
  CartDetailsModel,
  CartModel,
  MergeGuestCartRequest,
  RemoveCartItemRequest,
  UpdateCartItemRequest,
} from '../../../domain/models/cart.model';
import { ICartRepository } from '../../../domain/repositories/cart.repository.interface';
import { CartEntity } from '../../entities/cart.entity';
import { CartItemEntity } from '../../entities/cart-item.entity';
import { CartDetailsMapper } from './cart-details.mapper';
import { GetOrCreateCartAction } from './getOrCreateCart/getOrCreateCart.action';
import { GetOrCreateCartValidation } from './getOrCreateCart/getOrCreateCart.validation';
import { LoadCartAction } from './loadCart/loadCart.action';
import { AddToCartAction } from './addToCart/addToCart.action';
import { AddToCartValidation } from './addToCart/addToCart.validation';
import { UpdateCartItemAction } from './updateCartItem/updateCartItem.action';
import { UpdateCartItemValidation } from './updateCartItem/updateCartItem.validation';
import { RemoveCartItemAction } from './removeCartItem/removeCartItem.action';
import { RemoveCartItemValidation } from './removeCartItem/removeCartItem.validation';
import { ClearCartAction } from './clearCart/clearCart.action';
import { MergeCartsAction } from './mergeCarts/mergeCarts.action';
import { MergeCartsValidation } from './mergeCarts/mergeCarts.validation';

@Injectable()
export class DatabaseCartRepository implements ICartRepository {
  private readonly cartMapper: CartDetailsMapper;

  constructor(
    @InjectRepository(CartEntity)
    private readonly cartEntity: Repository<CartEntity>,
    @InjectRepository(CartItemEntity)
    private readonly cartItemEntity: Repository<CartItemEntity>,
    private readonly dataSource: DataSource,
  ) {
    this.cartMapper = new CartDetailsMapper(this.dataSource);
  }

  async getOrCreateCart(customerId?: string, sessionId?: string): Promise<CartModel> {
    new GetOrCreateCartValidation().execute(customerId, sessionId);
    return new GetOrCreateCartAction(this.cartEntity).execute(customerId, sessionId);
  }

  async loadCart(customerId?: string, sessionId?: string): Promise<CartDetailsModel | null> {
    return new LoadCartAction(this.cartEntity, this.cartMapper).execute(customerId, sessionId);
  }

  async addToCart(input: AddToCartRequest): Promise<CartDetailsModel> {
    new AddToCartValidation().execute(input);
    return this.runTransaction(async (session) => {
      return new AddToCartAction(session, this.cartMapper).execute(input);
    });
  }

  async updateCartItem(input: UpdateCartItemRequest): Promise<CartDetailsModel> {
    new UpdateCartItemValidation().execute(input);
    return this.runTransaction(async (session) => {
      return new UpdateCartItemAction(session, this.cartMapper).execute(input);
    });
  }

  async removeCartItem(input: RemoveCartItemRequest): Promise<CartDetailsModel> {
    new RemoveCartItemValidation().execute(input);
    return this.runTransaction(async (session) => {
      return new RemoveCartItemAction(session, this.cartMapper).execute(input);
    });
  }

  async clearCart(customerId?: string, sessionId?: string): Promise<boolean> {
    return this.runTransaction(async (session) => {
      return new ClearCartAction(session).execute(customerId, sessionId);
    });
  }

  async mergeGuestCart(input: MergeGuestCartRequest): Promise<CartDetailsModel> {
    new MergeCartsValidation().execute(input);
    return this.runTransaction(async (session) => {
      return new MergeCartsAction(session, this.cartMapper).execute(input);
    });
  }

  private async runTransaction<T>(work: (session: QueryRunner) => Promise<T>): Promise<T> {
    const session = this.dataSource.createQueryRunner();
    await session.connect();
    await session.startTransaction();
    try {
      const result = await work(session);
      await session.commitTransaction();
      return result;
    } catch (error) {
      await session.rollbackTransaction();
      throw error;
    } finally {
      await session.release();
    }
  }
}
