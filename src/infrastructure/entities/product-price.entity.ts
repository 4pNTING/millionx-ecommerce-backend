import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ProductPriceModel } from '../../domain/models/product-price.model';

@Entity('product_prices')
export class ProductPriceEntity implements ProductPriceModel {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  variantId: string;

  @Column()
  currency: string;

  @Column()
  amount: string;

  @Column({ nullable: true })
  compareAtAmount?: string;

  @Column({ nullable: true })
  startsAt?: Date;

  @Column({ nullable: true })
  endsAt?: Date;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
