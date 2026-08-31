import { NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { CustomerAddressModel, CustomerProfileModel } from '../../../domain/models/customer.model';
import { AddressEntity } from '../../entities/address.entity';
import { CustomerEntity } from '../../entities/customer.entity';

export class CustomerProfileMapper {
  constructor(
    private readonly customerRepository: Repository<CustomerEntity>,
    private readonly addressRepository: Repository<AddressEntity>,
  ) {}

  async hydrate(customer: CustomerEntity): Promise<CustomerProfileModel> {
    const addresses = await this.addressRepository.find({
      where: { customerId: customer.id },
      order: { isDefault: 'DESC', createdAt: 'ASC' },
    });
    return { ...customer, addresses: addresses.map((address) => this.mapAddress(address)) };
  }

  async profileByCustomerId(customerId: string): Promise<CustomerProfileModel> {
    const customer = await this.customerRepository.findOne({ where: { id: customerId } });
    if (!customer) throw new NotFoundException('Customer profile not found');
    return this.hydrate(customer);
  }

  private mapAddress(address: AddressEntity): CustomerAddressModel {
    return {
      ...address,
      latitude: address.latitude == null ? undefined : Number(address.latitude),
      longitude: address.longitude == null ? undefined : Number(address.longitude),
    };
  }
}
