import { Repository } from 'typeorm';
import { CustomerAccountEntity } from '../../../entities/customer-account.entity';

export class MarkCustomerLoginAction {
  constructor(private readonly repository: Repository<CustomerAccountEntity>) {}

  async execute(account: CustomerAccountEntity): Promise<void> {
    account.lastLoginAt = new Date();
    account.updatedAt = new Date();
    await this.repository.save(account);
  }
}
