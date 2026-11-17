import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
} from 'typeorm';
import { OrderItemModel } from '../../domain/models/order.model';

@Entity('order_items')
export class OrderItemEntity implements OrderItemModel {
  @PrimaryGeneratedColumn('uuid')
  _id: string;

  @Column('uuid')
  orderId: string;

  @Column('uuid')
  variantId: string;

  @Column({ length: 100 })
  sku: string;

  @Column({ length: 255 })
  productName: string;

  @Column({ length: 255 })
  variantName: string;

  @Column('int')
  quantity: number;

  @Column('numeric', { precision: 14, scale: 2 })
  unitPrice: string;

  @Column('numeric', { precision: 14, scale: 2 })
  subtotal: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}
