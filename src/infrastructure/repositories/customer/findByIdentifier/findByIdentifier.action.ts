import { Repository } from 'typeorm';
import { CustomerAccountLoginRecord } from '../../../../domain/models/customer-auth.model';
import { CustomerAccountEntity } from '../../../entities/customer-account.entity';
import { CustomerEntity } from '../../../entities/customer.entity';
import { NormalizedCustomerIdentifier } from './findByIdentifier.validation';

export class FindCustomerByIdentifierAction {
  constructor(
    private readonly customerRepository: Repository<CustomerEntity>,
    private readonly accountRepository: Repository<CustomerAccountEntity>,
  ) {}

  async execute(
    identifier: NormalizedCustomerIdentifier,
  ): Promise<CustomerAccountLoginRecord | null> {
    const customer = await this.customerRepository
      .createQueryBuilder('customer')
      .where('(lower(customer.email) = :identifier OR customer.phone = :phone)', {
        identifier: identifier.email,
        phone: identifier.phone,
      })
      .andWhere('customer.isActive = true')
      .getOne();
    if (!customer) return null;
    const account = await this.accountRepository.findOne({
      where: { customerId: customer.id, isActive: true },
    });
    if (!account) return null;
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
