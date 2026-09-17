import { UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import {
  CustomerAuthResponse,
  CustomerLoginRequest,
} from '../../domain/models/customer-auth.model';
import { ICustomerAuthRepository } from '../../domain/repositories/customer-auth.repository.interface';
import { AuthTokenService } from '../auth/auth-token.service';

export class LoginCustomerUseCase {
  constructor(
    private readonly repository: ICustomerAuthRepository,
    private readonly tokenService: AuthTokenService,
  ) {}

  async execute(input: CustomerLoginRequest): Promise<CustomerAuthResponse> {
    if (!input?.identifier || !input?.password) {
      throw new UnauthorizedException('Email/phone and password are required');
    }
    const account = await this.repository.findByIdentifier(input.identifier);
    if (!account || !(await bcrypt.compare(input.password, account.passwordHash))) {
      throw new UnauthorizedException('Invalid email/phone or password');
    }
    await this.repository.markLogin(account.accountId);
    const identity = {
      accountId: account.accountId,
      customerId: account.customerId,
      email: account.email,
      phone: account.phone,
    };
    const payload = {
      id: identity.accountId,
      customerId: identity.customerId,
      actorType: 'customer' as const,
      role: 'customer',
    };
    return { ...identity, ...this.tokenService.issue(payload) };
  }
}
