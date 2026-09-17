import { Repository } from 'typeorm';
import { CustomerPageModel, CustomerQuery } from '../../../../domain/models/customer.model';
import { AddressEntity } from '../../../entities/address.entity';
import { CustomerAccountEntity } from '../../../entities/customer-account.entity';
import { CustomerEntity } from '../../../entities/customer.entity';

interface CustomerListRawRow {
  accountId?: string | null;
  accountIsActive?: boolean | null;
  emailVerifiedAt?: Date | null;
  phoneVerifiedAt?: Date | null;
  lastLoginAt?: Date | null;
  addressCount?: string | number | null;
}

export class LoadCustomersAction {
  constructor(private readonly repository: Repository<CustomerEntity>) {}

  async execute(filter: CustomerQuery, page: number, limit: number): Promise<CustomerPageModel> {
    const query = this.repository
      .createQueryBuilder('customer')
      .leftJoin(CustomerAccountEntity, 'account', 'account.customerId = customer.id')
      .addSelect('account.id', 'accountId')
      .addSelect('account.isActive', 'accountIsActive')
      .addSelect('account.emailVerifiedAt', 'emailVerifiedAt')
      .addSelect('account.phoneVerifiedAt', 'phoneVerifiedAt')
      .addSelect('account.lastLoginAt', 'lastLoginAt')
      .addSelect(
        (subQuery) =>
          subQuery
            .select('COUNT(address.id)', 'count')
            .from(AddressEntity, 'address')
            .where('address.customerId = customer.id'),
        'addressCount',
      )
      .orderBy('customer.createdAt', 'DESC')
      .addOrderBy('customer.id', 'ASC');

    if (filter.keyword) {
      query.andWhere(
        `(customer.firstName ILIKE :keyword
          OR customer.lastName ILIKE :keyword
          OR customer.email ILIKE :keyword
          OR customer.phone ILIKE :keyword)`,
        { keyword: `%${filter.keyword}%` },
      );
    }

    if (filter.isActive !== undefined) {
      query.andWhere('customer.isActive = :isActive', { isActive: filter.isActive });
    }

    if (filter.accountIsActive !== undefined) {
      query.andWhere('account.isActive = :accountIsActive', {
        accountIsActive: filter.accountIsActive,
      });
    }

    const total = await query.clone().getCount();
    const { entities, raw } = await query
      .skip((page - 1) * limit)
      .take(limit)
      .getRawAndEntities<CustomerListRawRow>();

    const items = entities.map((customer, index) => {
      const account = raw[index] ?? {};
      return {
        ...customer,
        accountId: account.accountId ?? undefined,
        accountIsActive: account.accountIsActive ?? undefined,
        emailVerifiedAt: account.emailVerifiedAt ?? undefined,
        phoneVerifiedAt: account.phoneVerifiedAt ?? undefined,
        lastLoginAt: account.lastLoginAt ?? undefined,
        addressCount: Number(account.addressCount ?? 0),
      };
    });

    return { items, total, page, limit };
  }
}
