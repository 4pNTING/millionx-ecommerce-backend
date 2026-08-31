import {
  CreateCustomerAddressRequest,
  CustomerProfileModel,
  UpdateCustomerAddressRequest,
  UpsertCustomerProfileRequest,
} from '../models/customer.model';

export interface ICustomerRepository {
  loadProfile(customerId: string): Promise<CustomerProfileModel>;
  upsertProfile(
    customerId: string,
    input: UpsertCustomerProfileRequest,
  ): Promise<CustomerProfileModel>;
  createAddress(
    customerId: string,
    input: CreateCustomerAddressRequest,
  ): Promise<CustomerProfileModel>;
  updateAddress(
    customerId: string,
    input: UpdateCustomerAddressRequest,
  ): Promise<CustomerProfileModel>;
  setDefaultAddress(customerId: string, addressId: string): Promise<CustomerProfileModel>;
  deleteAddress(customerId: string, addressId: string): Promise<boolean>;
}
