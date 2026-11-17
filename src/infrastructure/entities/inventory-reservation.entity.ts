import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import {
  InventoryReservationModel,
  InventoryReservationStatus,
} from '../../domain/models/inventory.model';

@Entity('inventory_reservations')
export class InventoryReservationEntity implements InventoryReservationModel {
  @PrimaryGeneratedColumn('uuid')
  _id: string;

  @Column('uuid')
  orderId: string;

  @Column('uuid')
  variantId: string;

  @Column('int')
  quantity: number;

  @Column({ length: 50, default: 'active' })
  status: InventoryReservationStatus;

  @Column('timestamptz')
  expiresAt: Date;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
