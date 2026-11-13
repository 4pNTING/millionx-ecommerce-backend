import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';
import { WishlistItemModel } from '../../domain/models/wishlist.model';

@Entity('wishlist_items')
export class WishlistItemEntity implements WishlistItemModel {
  @PrimaryGeneratedColumn('uuid')
  _id: string;

  @Column('uuid')
  wishlistId: string;

  @Column('uuid')
  productId: string;

  @CreateDateColumn()
  addedAt: Date;
}
