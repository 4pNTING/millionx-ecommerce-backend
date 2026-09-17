import {
  CustomerAccountLoginRecord,
  RegisterCustomerRequest,
  RegisteredCustomerAccount,
} from '../models/customer-auth.model';

export interface ICustomerAuthRepository {
  register(
    input: RegisterCustomerRequest,
    passwordHash: string,
  ): Promise<RegisteredCustomerAccount>;
  findByIdentifier(identifier: string): Promise<CustomerAccountLoginRecord | null>;
  findByAccountId(accountId: string): Promise<CustomerAccountLoginRecord | null>;
  markLogin(accountId: string): Promise<void>;
}
