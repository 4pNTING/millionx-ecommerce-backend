import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ProductVariantModel } from '../../domain/models/product-variant.model';

@Entity('product_variants')
export class ProductVariantEntity implements ProductVariantModel {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  productId: string;

  @Column({ length: 100, unique: true })
  sku: string;

  @Column({ length: 100, nullable: true })
  barcode?: string;

  @Column({ length: 160, nullable: true })
  name?: string;

  @Column('jsonb', { default: {} })
  attributes: Record<string, unknown>;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
