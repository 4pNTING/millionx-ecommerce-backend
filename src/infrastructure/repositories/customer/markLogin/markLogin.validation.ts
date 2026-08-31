import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { CustomerAccountEntity } from '../../../entities/customer-account.entity';

export class MarkCustomerLoginValidation {
  constructor(private readonly repository: Repository<CustomerAccountEntity>) {}

  async execute(accountId: string): Promise<CustomerAccountEntity> {
    if (!accountId) throw new BadRequestException('Customer account id is required');
    const account = await this.repository.findOne({ where: { id: accountId, isActive: true } });
    if (!account) throw new NotFoundException('Active customer account not found');
    return account;
  }
}
