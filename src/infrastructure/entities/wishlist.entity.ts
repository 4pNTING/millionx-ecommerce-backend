import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { WishlistModel } from '../../domain/models/wishlist.model';

@Entity('wishlists')
export class WishlistEntity implements WishlistModel {
  @PrimaryGeneratedColumn('uuid')
  _id: string;

  @Column('uuid', { unique: true })
  customerId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
