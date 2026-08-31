import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ProductModel } from '../../domain/models/product.model';

@Entity('products')
export class ProductEntity implements ProductModel {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  categoryId: string;

  @Column({ length: 200 })
  name: string;

  @Column({ length: 220, unique: true })
  slug: string;

  @Column('text', { nullable: true })
  description?: string;

  @Column({ length: 150, nullable: true })
  brand?: string;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
