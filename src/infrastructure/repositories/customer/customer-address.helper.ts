import { EntityManager } from 'typeorm';
import { AddressEntity } from '../../entities/address.entity';

export class CustomerAddressHelper {
  static async clearDefault(customerId: string, manager: EntityManager): Promise<void> {
    await manager
      .getRepository(AddressEntity)
      .createQueryBuilder()
      .update(AddressEntity)
      .set({ isDefault: false })
      .where('"customerId" = :customerId', { customerId })
      .andWhere('"isDefault" = true')
      .execute();
  }
}
