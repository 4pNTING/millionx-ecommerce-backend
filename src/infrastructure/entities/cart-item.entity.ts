import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { CartItemModel } from '../../domain/models/cart.model';

@Entity('cart_items')
export class CartItemEntity implements CartItemModel {
  @PrimaryGeneratedColumn('uuid')
  _id: string;

  @Column('uuid')
  cartId: string;

  @Column('uuid')
  variantId: string;

  @Column('int')
  quantity: number;

  @CreateDateColumn()
  addedAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
