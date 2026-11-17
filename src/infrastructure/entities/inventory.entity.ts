import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { InventoryModel } from '../../domain/models/inventory.model';

@Entity('inventory')
export class InventoryEntity implements InventoryModel {
  @PrimaryGeneratedColumn('uuid')
  _id: string;

  @Column('uuid', { unique: true })
  variantId: string;

  @Column('int', { default: 0 })
  onHand: number;

  @Column('int', { default: 0 })
  reserved: number;

  @Column('int', { default: 0 })
  available: number;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
