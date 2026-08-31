import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { Not, Repository } from 'typeorm';
import { UpsertCustomerProfileRequest } from '../../../../domain/models/customer.model';
import { CustomerEntity } from '../../../entities/customer.entity';

export interface ValidatedCustomerProfile {
  customer: CustomerEntity;
  input: UpsertCustomerProfileRequest;
}

export class UpsertCustomerProfileValidation {
  constructor(private readonly repository: Repository<CustomerEntity>) {}

  async execute(
    customerId: string,
    input: UpsertCustomerProfileRequest,
  ): Promise<ValidatedCustomerProfile> {
    const customer = await this.repository.findOne({ where: { id: customerId, isActive: true } });
    if (!customer) throw new NotFoundException('Customer profile not found. Create it first.');

    const normalized: UpsertCustomerProfileRequest = { ...input };
    if (input.email !== undefined) normalized.email = input.email.trim().toLowerCase();
    if (input.phone !== undefined) {
      normalized.phone = input.phone.trim();
      if (!normalized.phone) throw new BadRequestException('Phone cannot be empty');
    }
    if (!(normalized.email ?? customer.email) && !(normalized.phone ?? customer.phone)) {
      throw new BadRequestException('Email or phone is required when creating a customer profile');
    }
    if (normalized.email) {
      const duplicate = await this.repository.findOne({
        where: { email: normalized.email, id: Not(customerId) },
      });
      if (duplicate) throw new ConflictException('Customer email already exists');
    }
    if (normalized.phone) {
      const duplicate = await this.repository.findOne({
        where: { phone: normalized.phone, id: Not(customerId) },
      });
      if (duplicate) throw new ConflictException('Customer phone already exists');
    }
    return { customer, input: normalized };
  }
}
