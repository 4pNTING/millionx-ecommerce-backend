import { BadRequestException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';
import {
  CustomerAuthResponse,
  RegisterCustomerRequest,
} from '../../domain/models/customer-auth.model';
import { ICustomerAuthRepository } from '../../domain/repositories/customer-auth.repository.interface';

export class RegisterCustomerUseCase {
  constructor(
    private readonly repository: ICustomerAuthRepository,
    private readonly jwtSecret: string,
    private readonly jwtExpiration: string,
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
      actorType: 'customer',
      role: 'customer',
    };
    return {
      ...identity,
      token: jwt.sign(payload, this.jwtSecret, {
        expiresIn: this.jwtExpiration as jwt.SignOptions['expiresIn'],
      }),
      refreshToken: jwt.sign(payload, this.jwtSecret, { expiresIn: '7d' }),
    };
  }
}
