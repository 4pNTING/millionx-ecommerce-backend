import { ForbiddenException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { QueryRunner } from 'typeorm';
import {
  RegisteredCustomerAccount,
  VerifiedSocialProfile,
} from '../../../../domain/models/customer-auth.model';
import { CustomerAccountEntity } from '../../../entities/customer-account.entity';
import { CustomerEntity } from '../../../entities/customer.entity';
import { CustomerSocialAccountEntity } from '../../../entities/customer-social-account.entity';

export class SocialLoginCustomerAction {
  constructor(private readonly session: QueryRunner) {}

  async execute(
    profile: VerifiedSocialProfile,
    fallback?: { firstName?: string; lastName?: string },
  ): Promise<RegisteredCustomerAccount> {
    const socialRepo = this.session.manager.getRepository(CustomerSocialAccountEntity);
    const customerRepo = this.session.manager.getRepository(CustomerEntity);
    const accountRepo = this.session.manager.getRepository(CustomerAccountEntity);

    const email = profile.email?.trim().toLowerCase() || undefined;

    // 1. Check if this social provider account is already linked
    const existingSocial = await socialRepo.findOne({
      where: { provider: profile.provider, providerId: profile.providerId },
    });

    if (existingSocial) {
      const customer = await customerRepo.findOne({ where: { _id: existingSocial.customerId } });
      if (!customer) {
        throw new NotFoundException('Customer profile not found');
      }
      if (!customer.isActive) {
        throw new ForbiddenException('Customer account is disabled');
      }

      let account = await accountRepo.findOne({ where: { customerId: customer._id } });
      if (!account) {
        const randomPassword = crypto.randomUUID();
        const passwordHash = await bcrypt.hash(randomPassword, 10);
        account = await accountRepo.save(
          accountRepo.create({ customerId: customer._id, passwordHash }),
        );
      }

      if (!account.isActive) {
        throw new ForbiddenException('Customer account is disabled');
      }

      account.lastLoginAt = new Date();
      await accountRepo.save(account);

      return {
        accountId: account._id,
        customer: { ...customer, addresses: [] },
      };
    }

    // 2. Check if a customer with the same email already exists in system (Account Linking)
    let customer: CustomerEntity | null = null;
    if (email) {
      customer = await customerRepo.findOne({ where: { email } });
    }

    if (customer) {
      if (!customer.isActive) {
        throw new ForbiddenException('Customer account is disabled');
      }

      // Link social provider to existing customer
      await socialRepo.save(
        socialRepo.create({
          customerId: customer._id,
          provider: profile.provider,
          providerId: profile.providerId,
          email,
        }),
      );

      let account = await accountRepo.findOne({ where: { customerId: customer._id } });
      if (!account) {
        const randomPassword = crypto.randomUUID();
        const passwordHash = await bcrypt.hash(randomPassword, 10);
        account = await accountRepo.save(
          accountRepo.create({ customerId: customer._id, passwordHash }),
        );
      }

      if (!account.isActive) {
        throw new ForbiddenException('Customer account is disabled');
      }

      account.lastLoginAt = new Date();
      await accountRepo.save(account);

      return {
        accountId: account._id,
        customer: { ...customer, addresses: [] },
      };
    }

    // 3. New Customer: Auto-Register
    const firstName = profile.firstName || fallback?.firstName || 'Customer';
    const lastName = profile.lastName || fallback?.lastName;

    customer = await customerRepo.save(
      customerRepo.create({
        firstName,
        lastName,
        email,
        isActive: true,
      }),
    );

    const randomPassword = crypto.randomUUID();
    const passwordHash = await bcrypt.hash(randomPassword, 10);
    const account = await accountRepo.save(
      accountRepo.create({
        customerId: customer._id,
        passwordHash,
        isActive: true,
        lastLoginAt: new Date(),
        emailVerifiedAt: email ? new Date() : undefined,
      }),
    );

    await socialRepo.save(
      socialRepo.create({
        customerId: customer._id,
        provider: profile.provider,
        providerId: profile.providerId,
        email,
      }),
    );

    return {
      accountId: account._id,
      customer: { ...customer, addresses: [] },
    };
  }
}
