import { DynamicModule, Module } from '@nestjs/common';
import { RepositoriesModule } from '../repositories/repositories.module';
import { DatabaseInventoryRepository } from '../repositories/inventory/inventory.repository';
import { GetInventoryUseCase } from '../../usecases/inventory/getInventory.usecase';
import { AdjustStockUseCase } from '../../usecases/inventory/adjustStock.usecase';
import { ReleaseExpiredReservationsUseCase } from '../../usecases/inventory/releaseExpiredReservations.usecase';

@Module({ imports: [RepositoriesModule] })
export class InventoryUsecasesProxyModule {
  static GET_INVENTORY_PROXY = 'GetInventoryProxy';
  static ADJUST_STOCK_PROXY = 'AdjustStockProxy';
  static RELEASE_EXPIRED_RESERVATIONS_PROXY = 'ReleaseExpiredReservationsProxy';

  static register(): DynamicModule {
    const factory = (UseCase: new (repository: DatabaseInventoryRepository) => unknown) => ({
      inject: [DatabaseInventoryRepository],
      useFactory: (repository: DatabaseInventoryRepository) => new UseCase(repository),
    });

    return {
      module: InventoryUsecasesProxyModule,
      providers: [
        { provide: this.GET_INVENTORY_PROXY, ...factory(GetInventoryUseCase) },
        { provide: this.ADJUST_STOCK_PROXY, ...factory(AdjustStockUseCase) },
        {
          provide: this.RELEASE_EXPIRED_RESERVATIONS_PROXY,
          ...factory(ReleaseExpiredReservationsUseCase),
        },
      ],
      exports: [
        this.GET_INVENTORY_PROXY,
        this.ADJUST_STOCK_PROXY,
        this.RELEASE_EXPIRED_RESERVATIONS_PROXY,
      ],
    };
  }
}
