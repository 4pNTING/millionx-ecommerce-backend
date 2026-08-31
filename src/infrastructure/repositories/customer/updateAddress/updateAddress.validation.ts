import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { UpdateCustomerAddressRequest } from '../../../../domain/models/customer.model';
import { AddressEntity } from '../../../entities/address.entity';
import { CustomerEntity } from '../../../entities/customer.entity';

export class UpdateCustomerAddressValidation {
  constructor(
    private readonly customerRepository: Repository<CustomerEntity>,
    private readonly addressRepository: Repository<AddressEntity>,
  ) {}

  async execute(customerId: string, input: UpdateCustomerAddressRequest) {
    const customer = await this.customerRepository.findOne({
      where: { id: customerId, isActive: true },
    });
    if (!customer) throw new NotFoundException('Customer profile not found. Create it first.');
    const address = await this.addressRepository.findOne({ where: { id: input.id, customerId } });
    if (!address) throw new NotFoundException('Customer address not found');
    if (input.isDefault === false && address.isDefault) {
      throw new BadRequestException(
        'Use setDefaultCustomerAddress to choose another default address',
      );
    }
    return { address };
  }
}
