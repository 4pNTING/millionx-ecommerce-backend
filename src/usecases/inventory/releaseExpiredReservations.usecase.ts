import { IInventoryRepository } from '../../domain/repositories/inventory.repository.interface';

export class ReleaseExpiredReservationsUseCase {
  constructor(private readonly inventoryRepository: IInventoryRepository) {}

  execute() {
    return this.inventoryRepository.releaseExpiredReservations();
  }
}
