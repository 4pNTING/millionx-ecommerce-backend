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

export enum SocialProvider {
  GOOGLE = 'GOOGLE',
  FACEBOOK = 'FACEBOOK',
}

export interface SocialLoginCustomerRequest {
  provider: SocialProvider;
  token: string;
  firstName?: string;
  lastName?: string;
}

export interface VerifiedSocialProfile {
  provider: SocialProvider;
  providerId: string;
  email?: string;
  firstName?: string;
  lastName?: string;
}

export interface CustomerSocialAccountModel {
  _id: string;
  customerId: string;
  provider: SocialProvider;
  providerId: string;
  email?: string;
  createdAt: Date;
  updatedAt: Date;
}
