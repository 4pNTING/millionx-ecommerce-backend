export class CustomerAccountModel {
  id: string;
  customerId: string;
  passwordHash: string;
  isActive: boolean;
  emailVerifiedAt?: Date;
  phoneVerifiedAt?: Date;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}
