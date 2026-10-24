import { Repository } from 'typeorm';
import { CustomerPageModel, CustomerQuery } from '../../../../domain/models/customer.model';
import { AddressEntity } from '../../../entities/address.entity';
import { CustomerAccountEntity } from '../../../entities/customer-account.entity';
import { CustomerEntity } from '../../../entities/customer.entity';
import { ActiveStatus } from '../../../../domain/enums/enum';
import { activeStatusValue } from '../../../common/active-status.filter';

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

  async execute(filter: CustomerQuery = {}): Promise<CustomerPageModel> {
    const page = filter.page ?? 1;
    const limit = filter.limit ?? 20;

    const query = this.repository
      .createQueryBuilder('customer')
      .leftJoin(CustomerAccountEntity, 'account', 'account.customerId = customer._id')
      .addSelect('account._id', 'accountId')
      .addSelect('account.isActive', 'accountIsActive')
      .addSelect('account.emailVerifiedAt', 'emailVerifiedAt')
      .addSelect('account.phoneVerifiedAt', 'phoneVerifiedAt')
      .addSelect('account.lastLoginAt', 'lastLoginAt')
      .addSelect(
        (subQuery) =>
          subQuery
            .select('COUNT(address._id)', 'count')
            .from(AddressEntity, 'address')
            .where('address.customerId = customer._id'),
        'addressCount',
      )
      .orderBy('customer.createdAt', 'DESC')
      .addOrderBy('customer._id', 'ASC');

    const keyword = filter.keyword?.trim();
    if (keyword) {
      query.andWhere(
        `(customer.firstName ILIKE :keyword
          OR customer.lastName ILIKE :keyword
          OR customer.email ILIKE :keyword
          OR customer.phone ILIKE :keyword)`,
        { keyword: `%${keyword}%` },
      );
    }

    const isActive = activeStatusValue(filter.isActive, ActiveStatus.all);
    if (isActive !== undefined) {
      query.andWhere('customer.isActive = :isActive', { isActive });
    }

    const accountIsActive = activeStatusValue(filter.accountIsActive, ActiveStatus.all);
    if (accountIsActive !== undefined) {
      query.andWhere('account.isActive = :accountIsActive', {
        accountIsActive,
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
