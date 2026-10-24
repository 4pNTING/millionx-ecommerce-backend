import {
  CustomerAuthResponse,
  SocialLoginCustomerRequest,
} from '../../domain/models/customer-auth.model';
import { ICustomerAuthRepository } from '../../domain/repositories/customer-auth.repository.interface';
import { AuthTokenService } from '../auth/auth-token.service';
import { SocialAuthService } from '../../infrastructure/common/social-auth.service';

export class SocialLoginCustomerUseCase {
  constructor(
    private readonly repository: ICustomerAuthRepository,
    private readonly tokenService: AuthTokenService,
    private readonly socialAuthService: SocialAuthService,
  ) {}

  async execute(input: SocialLoginCustomerRequest): Promise<CustomerAuthResponse> {
    const verifiedProfile = await this.socialAuthService.verify(input.provider, input.token);
    const registered = await this.repository.socialLogin(verifiedProfile, {
      firstName: input.firstName,
      lastName: input.lastName,
    });

    const payload = {
      id: registered.accountId,
      customerId: registered.customer._id,
      actorType: 'customer' as const,
      role: 'customer',
    };

    return {
      accountId: registered.accountId,
      customerId: registered.customer._id,
      email: registered.customer.email,
      phone: registered.customer.phone,
      ...this.tokenService.issue(payload),
    };
  }
}
