import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
} from 'typeorm';
import {
  InventoryMovementModel,
  InventoryMovementReferenceType,
  InventoryMovementType,
} from '../../domain/models/inventory.model';

@Entity('inventory_movements')
export class InventoryMovementEntity implements InventoryMovementModel {
  @PrimaryGeneratedColumn('uuid')
  _id: string;

  @Column('uuid')
  variantId: string;

  @Column({ length: 50 })
  type: InventoryMovementType;

  @Column('int')
  quantity: number;

  @Column({ length: 50 })
  referenceType: InventoryMovementReferenceType;

  @Column('uuid', { nullable: true })
  referenceId?: string | null;

  @Column('text', { nullable: true })
  note?: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}
