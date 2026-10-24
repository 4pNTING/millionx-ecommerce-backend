import {
  CustomerAccountLoginRecord,
  RegisterCustomerRequest,
  RegisteredCustomerAccount,
  VerifiedSocialProfile,
} from '../models/customer-auth.model';

export interface ICustomerAuthRepository {
  register(
    input: RegisterCustomerRequest,
    passwordHash: string,
  ): Promise<RegisteredCustomerAccount>;
  findByIdentifier(identifier: string): Promise<CustomerAccountLoginRecord | null>;
  findByAccountId(accountId: string): Promise<CustomerAccountLoginRecord | null>;
  markLogin(accountId: string): Promise<void>;
  socialLogin(
    profile: VerifiedSocialProfile,
    fallback?: { firstName?: string; lastName?: string },
  ): Promise<RegisteredCustomerAccount>;
}
