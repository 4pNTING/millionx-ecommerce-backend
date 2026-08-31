import { NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { CustomerEntity } from '../../../entities/customer.entity';

export class LoadCustomerProfileValidation {
  constructor(private readonly repository: Repository<CustomerEntity>) {}

  async execute(customerId: string): Promise<CustomerEntity> {
    const customer = await this.repository.findOne({ where: { id: customerId, isActive: true } });
    if (!customer) throw new NotFoundException('Customer profile not found. Create it first.');
    return customer;
  }
}
