import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { CategoryModel } from '../../domain/models/category.model';

@Entity('categories')
export class CategoryEntity implements CategoryModel {
  @PrimaryGeneratedColumn('uuid')
  _id: string;

  @Column('uuid', { nullable: true })
  parentId?: string;

  @Column()
  name: string;

  @Column({ unique: true })
  slug: string;

  @Column({ nullable: true })
  description?: string;

  @Column({ default: 0 })
  sortOrder: number;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
