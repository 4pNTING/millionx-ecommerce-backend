import { BadRequestException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import {
  CustomerAuthResponse,
  RegisterCustomerRequest,
} from '../../domain/models/customer-auth.model';
import { ICustomerAuthRepository } from '../../domain/repositories/customer-auth.repository.interface';
import { AuthTokenService } from '../auth/auth-token.service';

export class RegisterCustomerUseCase {
  constructor(
    private readonly repository: ICustomerAuthRepository,
    private readonly tokenService: AuthTokenService,
  ) {}

  async execute(input: RegisterCustomerRequest): Promise<CustomerAuthResponse> {
    if (!input?.password || input.password.length < 8) {
      throw new BadRequestException('Password must contain at least 8 characters');
    }
    const passwordHash = await bcrypt.hash(input.password, 12);
    const registered = await this.repository.register(input, passwordHash);
    return this.issueTokens({
      accountId: registered.accountId,
      customerId: registered.customer.id,
      email: registered.customer.email,
      phone: registered.customer.phone,
    });
  }

  private issueTokens(
    identity: Omit<CustomerAuthResponse, 'token' | 'refreshToken'>,
  ): CustomerAuthResponse {
    const payload = {
      id: identity.accountId,
      customerId: identity.customerId,
      actorType: 'customer' as const,
      role: 'customer',
    };
    return { ...identity, ...this.tokenService.issue(payload) };
  }
}
