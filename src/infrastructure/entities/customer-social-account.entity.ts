import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Unique,
  Index,
} from 'typeorm';
import {
  CustomerSocialAccountModel,
  SocialProvider,
} from '../../domain/models/customer-auth.model';

@Entity('customer_social_accounts')
@Unique('uq_customer_provider', ['provider', 'providerId'])
export class CustomerSocialAccountEntity implements CustomerSocialAccountModel {
  @PrimaryGeneratedColumn('uuid')
  _id: string;

  @Index('idx_customer_social_customer_id')
  @Column('uuid')
  customerId: string;

  @Column({ length: 30 })
  provider: SocialProvider;

  @Column({ length: 255 })
  providerId: string;

  @Column({ length: 320, nullable: true })
  email?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
