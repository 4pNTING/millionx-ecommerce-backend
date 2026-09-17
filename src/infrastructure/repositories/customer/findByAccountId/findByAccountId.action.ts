import { Repository } from 'typeorm';
import { CustomerAccountLoginRecord } from '../../../../domain/models/customer-auth.model';
import { CustomerAccountEntity } from '../../../entities/customer-account.entity';
import { CustomerEntity } from '../../../entities/customer.entity';

export class FindCustomerByAccountIdAction {
  constructor(
    private readonly customerRepository: Repository<CustomerEntity>,
    private readonly accountRepository: Repository<CustomerAccountEntity>,
  ) {}

  async execute(accountId: string): Promise<CustomerAccountLoginRecord | null> {
    const account = await this.accountRepository.findOne({
      where: { id: accountId, isActive: true },
    });
    if (!account) return null;

    const customer = await this.customerRepository.findOne({
      where: { id: account.customerId, isActive: true },
    });
    if (!customer) return null;

    return {
      accountId: account.id,
      customerId: customer.id,
      passwordHash: account.passwordHash,
      isActive: account.isActive,
      email: customer.email,
      phone: customer.phone,
    };
  }
}
