import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
} from 'typeorm';
import { OrderStatusHistoryModel } from '../../domain/models/order.model';

@Entity('order_status_history')
export class OrderStatusHistoryEntity implements OrderStatusHistoryModel {
  @PrimaryGeneratedColumn('uuid')
  _id: string;

  @Column('uuid')
  orderId: string;

  @Column({ length: 50, nullable: true })
  fromStatus?: string | null;

  @Column({ length: 50 })
  toStatus: string;

  @Column('text', { nullable: true })
  note?: string | null;

  @Column({ length: 100, default: 'system' })
  createdBy: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}
