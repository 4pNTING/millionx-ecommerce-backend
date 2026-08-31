import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { CustomerModel } from '../../domain/models/customer.model';

@Entity('customers')
export class CustomerEntity implements CustomerModel {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 120, nullable: true })
  firstName?: string;

  @Column({ length: 120, nullable: true })
  lastName?: string;

  @Column({ length: 320, nullable: true })
  email?: string;

  @Column({ length: 40, nullable: true })
  phone?: string;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
