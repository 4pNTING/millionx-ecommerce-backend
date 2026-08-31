import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';
import { ProductImageModel } from '../../domain/models/product-image.model';

@Entity('product_images')
export class ProductImageEntity implements ProductImageModel {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  productId: string;

  @Column('uuid', { nullable: true })
  variantId?: string;

  @Column('text')
  url: string;

  @Column({ nullable: true })
  altText?: string;

  @Column('int', { default: 0 })
  sortOrder: number;

  @CreateDateColumn()
  createdAt: Date;
}
