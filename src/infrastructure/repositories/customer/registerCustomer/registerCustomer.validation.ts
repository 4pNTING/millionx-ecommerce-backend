import { BadRequestException, ConflictException } from '@nestjs/common';
import { QueryRunner } from 'typeorm';
import { RegisterCustomerRequest } from '../../../../domain/models/customer-auth.model';
import { CustomerAccountEntity } from '../../../entities/customer-account.entity';
import { CustomerEntity } from '../../../entities/customer.entity';

export interface ValidatedCustomerRegistration {
  email?: string;
  phone?: string;
  customer?: CustomerEntity;
}

export class RegisterCustomerValidation {
  constructor(private readonly session: QueryRunner) {}

  async execute(input: RegisterCustomerRequest): Promise<ValidatedCustomerRegistration> {
    const email = input.email?.trim().toLowerCase() || undefined;
    const phone = input.phone?.trim() || undefined;
    if (!email && !phone) throw new BadRequestException('Email or phone is required');

    const customers = this.session.manager.getRepository(CustomerEntity);
    const accounts = this.session.manager.getRepository(CustomerAccountEntity);
    const emailCustomer = email ? await customers.findOne({ where: { email } }) : null;
    const phoneCustomer = phone ? await customers.findOne({ where: { phone } }) : null;
    if (emailCustomer && phoneCustomer && emailCustomer.id !== phoneCustomer.id) {
      throw new ConflictException('Email and phone belong to different customers');
    }

    const customer = emailCustomer ?? phoneCustomer;
    if (customer) {
      const existingAccount = await accounts.findOne({ where: { customerId: customer.id } });
      if (existingAccount) throw new ConflictException('Customer account already exists');
    }
    return { email, phone, customer };
  }
}
