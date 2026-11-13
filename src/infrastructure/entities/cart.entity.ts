import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { CartModel } from '../../domain/models/cart.model';

@Entity('carts')
export class CartEntity implements CartModel {
  @PrimaryGeneratedColumn('uuid')
  _id: string;

  @Column('uuid', { nullable: true })
  customerId?: string | null;

  @Column({ length: 120, nullable: true })
  sessionId?: string | null;

  @Column({ default: true })
  isActive: boolean;

  @Column('uuid', { nullable: true })
  mergedIntoCartId?: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
