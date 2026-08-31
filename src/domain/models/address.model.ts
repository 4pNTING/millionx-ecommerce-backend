export class AddressModel {
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
  latitude?: string;
  longitude?: string;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}
