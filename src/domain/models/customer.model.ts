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
