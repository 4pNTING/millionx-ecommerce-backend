import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';
import { ProductImageModel } from '../../domain/models/product-image.model';

@Entity('product_images')
export class ProductImageEntity implements ProductImageModel {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  productId: string;

  @Column('uuid', { nullable: true })
  variantId?: string | null;

  @Column('text')
  url: string;

  @Column('varchar', { nullable: true })
  altText?: string | null;

  @Column('int', { default: 0 })
  sortOrder: number;

  @CreateDateColumn()
  createdAt: Date;
}
