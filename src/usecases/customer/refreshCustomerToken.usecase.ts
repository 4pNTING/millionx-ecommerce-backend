import { UnauthorizedException } from '@nestjs/common';
import { CustomerAuthResponse } from '../../domain/models/customer-auth.model';
import { ICustomerAuthRepository } from '../../domain/repositories/customer-auth.repository.interface';
import { AuthTokenService } from '../auth/auth-token.service';

export class RefreshCustomerTokenUseCase {
  constructor(
    private readonly repository: ICustomerAuthRepository,
    private readonly tokenService: AuthTokenService,
  ) {}

  async execute(refreshToken: string): Promise<CustomerAuthResponse> {
    const payload = this.tokenService.verifyRefreshToken(refreshToken, 'customer');
    const account = await this.repository.findByAccountId(payload.id);

    if (!account?.isActive) {
      throw new UnauthorizedException('Customer account is inactive or no longer exists');
    }

    const identity = {
      accountId: account.accountId,
      customerId: account.customerId,
      email: account.email,
      phone: account.phone,
    };

    return {
      ...identity,
      ...this.tokenService.issue({
        id: identity.accountId,
        customerId: identity.customerId,
        actorType: 'customer',
        role: 'customer',
      }),
    };
  }
}
