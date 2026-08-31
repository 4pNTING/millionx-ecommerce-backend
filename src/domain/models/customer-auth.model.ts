import { CustomerProfileModel } from './customer.model';

export interface RegisterCustomerRequest {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  password: string;
}

export interface CustomerLoginRequest {
  identifier: string;
  password: string;
}

export interface CustomerAccountLoginRecord {
  accountId: string;
  customerId: string;
  passwordHash: string;
  isActive: boolean;
  email?: string;
  phone?: string;
}

export interface RegisteredCustomerAccount {
  accountId: string;
  customer: CustomerProfileModel;
}

export interface CustomerAuthResponse {
  accountId: string;
  customerId: string;
  email?: string;
  phone?: string;
  token: string;
  refreshToken: string;
}
