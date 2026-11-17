import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import {
  OrderModel,
  OrderStatus,
  OrderShippingAddress,
} from '../../domain/models/order.model';

@Entity('orders')
export class OrderEntity implements OrderModel {
  @PrimaryGeneratedColumn('uuid')
  _id: string;

  @Column({ length: 64, unique: true })
  orderNumber: string;

  @Column('uuid')
  customerId: string;

  @Column('uuid', { nullable: true })
  checkoutSessionId?: string | null;

  @Column('numeric', { precision: 14, scale: 2, default: 0.0 })
  subtotal: string;

  @Column('numeric', { precision: 14, scale: 2, default: 0.0 })
  discountAmount: string;

  @Column('numeric', { precision: 14, scale: 2, default: 0.0 })
  shippingAmount: string;

  @Column('numeric', { precision: 14, scale: 2, default: 0.0 })
  taxAmount: string;

  @Column('numeric', { precision: 14, scale: 2, default: 0.0 })
  total: string;

  @Column({ length: 3 })
  currency: string;

  @Column({ length: 50, default: 'pending' })
  status: OrderStatus;

  @Column('jsonb')
  shippingAddress: OrderShippingAddress;

  @Column('jsonb', { nullable: true })
  billingAddress?: OrderShippingAddress | null;

  @Column('text', { nullable: true })
  notes?: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
