import { IInventoryRepository } from '../../domain/repositories/inventory.repository.interface';

export class GetInventoryUseCase {
  constructor(private readonly inventoryRepository: IInventoryRepository) {}

  execute(variantId: string) {
    return this.inventoryRepository.getInventory(variantId);
  }
}
