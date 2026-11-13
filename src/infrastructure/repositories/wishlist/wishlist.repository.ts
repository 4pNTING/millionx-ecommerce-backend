import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, QueryRunner, Repository } from 'typeorm';
import {
  AddToWishlistRequest,
  RemoveFromWishlistRequest,
  WishlistDetailsModel,
} from '../../../domain/models/wishlist.model';
import { IWishlistRepository } from '../../../domain/repositories/wishlist.repository.interface';
import { WishlistEntity } from '../../entities/wishlist.entity';
import { WishlistItemEntity } from '../../entities/wishlist-item.entity';
import { WishlistDetailsMapper } from './wishlist-details.mapper';
import { LoadWishlistAction } from './loadWishlist/loadWishlist.action';
import { AddToWishlistAction } from './addToWishlist/addToWishlist.action';
import { AddToWishlistValidation } from './addToWishlist/addToWishlist.validation';
import { RemoveFromWishlistAction } from './removeFromWishlist/removeFromWishlist.action';
import { RemoveFromWishlistValidation } from './removeFromWishlist/removeFromWishlist.validation';

@Injectable()
export class DatabaseWishlistRepository implements IWishlistRepository {
  private readonly mapper: WishlistDetailsMapper;

  constructor(
    @InjectRepository(WishlistEntity)
    private readonly wishlistEntity: Repository<WishlistEntity>,
    @InjectRepository(WishlistItemEntity)
    private readonly wishlistItemEntity: Repository<WishlistItemEntity>,
    private readonly dataSource: DataSource,
  ) {
    this.mapper = new WishlistDetailsMapper(this.dataSource);
  }

  async loadWishlist(customerId: string): Promise<WishlistDetailsModel> {
    return new LoadWishlistAction(this.wishlistEntity, this.mapper).execute(customerId);
  }

  async addToWishlist(input: AddToWishlistRequest): Promise<WishlistDetailsModel> {
    new AddToWishlistValidation().execute(input);
    return this.runTransaction(async (session) => {
      return new AddToWishlistAction(session, this.mapper).execute(input);
    });
  }

  async removeFromWishlist(input: RemoveFromWishlistRequest): Promise<WishlistDetailsModel> {
    new RemoveFromWishlistValidation().execute(input);
    return this.runTransaction(async (session) => {
      return new RemoveFromWishlistAction(session, this.mapper).execute(input);
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
