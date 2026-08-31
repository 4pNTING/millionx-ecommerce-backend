import { QueryRunner } from 'typeorm';
import { AddressEntity } from '../../../entities/address.entity';

export class DeleteCustomerAddressAction {
  constructor(private readonly session: QueryRunner) {}

  async execute(address: AddressEntity): Promise<boolean> {
    const repository = this.session.manager.getRepository(AddressEntity);
    const wasDefault = address.isDefault;
    await repository.remove(address);
    if (wasDefault) {
      const replacement = await repository.findOne({
        where: { customerId: address.customerId },
        order: { createdAt: 'ASC' },
      });
      if (replacement) {
        replacement.isDefault = true;
        await repository.save(replacement);
      }
    }
    return true;
  }
}
