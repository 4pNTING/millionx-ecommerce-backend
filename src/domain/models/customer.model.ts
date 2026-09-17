export class CustomerModel {
  id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CustomerAddressModel {
  id: string;
  customerId: string;
  label: string;
  recipientName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  village?: string;
  district?: string;
  province: string;
  postalCode?: string;
  countryCode: string;
  latitude?: number;
  longitude?: number;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CustomerProfileModel extends CustomerModel {
  addresses: CustomerAddressModel[];
}

export interface CustomerListItemModel extends CustomerModel {
  accountId?: string;
  accountIsActive?: boolean;
  emailVerifiedAt?: Date;
  phoneVerifiedAt?: Date;
  lastLoginAt?: Date;
  addressCount: number;
}

export interface CustomerPageModel {
  items: CustomerListItemModel[];
  total: number;
  page: number;
  limit: number;
}

export interface CustomerQuery {
  keyword?: string;
  page?: number;
  limit?: number;
  isActive?: boolean;
  accountIsActive?: boolean;
}

export interface UpsertCustomerProfileRequest {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
}

export interface CreateCustomerAddressRequest {
  label: string;
  recipientName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  village?: string;
  district?: string;
  province: string;
  postalCode?: string;
  countryCode?: string;
  latitude?: number;
  longitude?: number;
  isDefault?: boolean;
}

export interface UpdateCustomerAddressRequest extends Partial<CreateCustomerAddressRequest> {
  id: string;
}
