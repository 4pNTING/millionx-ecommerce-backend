import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { AddressModel } from '../../domain/models/address.model';

@Entity('addresses')
export class AddressEntity implements AddressModel {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  customerId: string;

  @Column({ length: 80 })
  label: string;

  @Column({ length: 200 })
  recipientName: string;

  @Column({ length: 40 })
  phone: string;

  @Column({ length: 250 })
  addressLine1: string;

  @Column({ length: 250, nullable: true })
  addressLine2?: string;

  @Column({ length: 150, nullable: true })
  village?: string;

  @Column({ length: 150, nullable: true })
  district?: string;

  @Column({ length: 150 })
  province: string;

  @Column({ length: 30, nullable: true })
  postalCode?: string;

  @Column('char', { length: 2, default: 'LA' })
  countryCode: string;

  @Column('numeric', { precision: 9, scale: 6, nullable: true })
  latitude?: string;

  @Column('numeric', { precision: 9, scale: 6, nullable: true })
  longitude?: string;

  @Column('boolean', { default: false })
  isDefault: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
