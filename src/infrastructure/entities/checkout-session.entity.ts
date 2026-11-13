import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import {
  CheckoutSessionModel,
  PriceSnapshotItemModel,
} from '../../domain/models/checkout-session.model';

@Entity('checkout_sessions')
export class CheckoutSessionEntity implements CheckoutSessionModel {
  @PrimaryGeneratedColumn('uuid')
  _id: string;

  @Column('uuid')
  cartId: string;

  @Column('uuid', { nullable: true })
  customerId?: string | null;

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

  @Column('jsonb', { default: [] })
  priceSnapshot: PriceSnapshotItemModel[];

  @Column({ length: 50, default: 'open' })
  status: 'open' | 'completed' | 'expired' | 'abandoned';

  @Column('timestamptz')
  expiresAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
