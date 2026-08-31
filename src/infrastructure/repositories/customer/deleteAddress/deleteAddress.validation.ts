import { NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { AddressEntity } from '../../../entities/address.entity';
import { CustomerEntity } from '../../../entities/customer.entity';

export class DeleteCustomerAddressValidation {
  constructor(
    private readonly customerRepository: Repository<CustomerEntity>,
    private readonly addressRepository: Repository<AddressEntity>,
  ) {}

  async execute(customerId: string, addressId: string): Promise<AddressEntity> {
    const customer = await this.customerRepository.findOne({
      where: { id: customerId, isActive: true },
    });
    if (!customer) throw new NotFoundException('Customer profile not found. Create it first.');
    const address = await this.addressRepository.findOne({ where: { id: addressId, customerId } });
    if (!address) throw new NotFoundException('Customer address not found');
    return address;
  }
}
