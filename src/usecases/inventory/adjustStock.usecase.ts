import { AdjustStockRequest } from '../../domain/models/inventory.model';
import { IInventoryRepository } from '../../domain/repositories/inventory.repository.interface';

export class AdjustStockUseCase {
  constructor(private readonly inventoryRepository: IInventoryRepository) {}

  execute(input: AdjustStockRequest) {
    return this.inventoryRepository.adjustStock(input);
  }
}
