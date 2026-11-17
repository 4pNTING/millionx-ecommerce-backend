import { Inject, UseGuards } from '@nestjs/common';
import { Args, Int, Mutation, Query, Resolver } from '@nestjs/graphql';
import { JwtAuthGuard } from '../../common/jwt-auth.guard';
import { CatalogWriteGuard } from '../../common/catalog-write.guard';
import { OptionalJwtAuthGuard } from '../../common/optional-jwt-auth.guard';
import { InventoryUsecasesProxyModule } from '../../usecases-proxy/inventory-usecases-proxy.module';
import { GetInventoryUseCase } from '../../../usecases/inventory/getInventory.usecase';
import { AdjustStockUseCase } from '../../../usecases/inventory/adjustStock.usecase';
import { ReleaseExpiredReservationsUseCase } from '../../../usecases/inventory/releaseExpiredReservations.usecase';
import { AdjustStockDto, Inventory } from './inventory.model';
import {
  InventoryMovementReferenceType,
  InventoryMovementType,
} from '../../../domain/models/inventory.model';

@Resolver(() => Inventory)
export class InventoryResolver {
  constructor(
    @Inject(InventoryUsecasesProxyModule.GET_INVENTORY_PROXY)
    private readonly getInventoryUseCase: GetInventoryUseCase,
    @Inject(InventoryUsecasesProxyModule.ADJUST_STOCK_PROXY)
    private readonly adjustStockUseCase: AdjustStockUseCase,
    @Inject(InventoryUsecasesProxyModule.RELEASE_EXPIRED_RESERVATIONS_PROXY)
    private readonly releaseExpiredReservationsUseCase: ReleaseExpiredReservationsUseCase,
  ) {}

  @Query(() => Inventory, { nullable: true })
  @UseGuards(OptionalJwtAuthGuard)
  async inventory(@Args('variantId') variantId: string) {
    return this.getInventoryUseCase.execute(variantId);
  }

  @Mutation(() => Inventory)
  @UseGuards(JwtAuthGuard, CatalogWriteGuard)
  async adjustInventory(@Args('input') input: AdjustStockDto) {
    return this.adjustStockUseCase.execute({
      variantId: input.variantId,
      quantityDelta: input.quantityDelta,
      type: input.type as InventoryMovementType,
      referenceType: input.referenceType as InventoryMovementReferenceType,
      note: input.note,
    });
  }

  @Mutation(() => Int)
  @UseGuards(JwtAuthGuard, CatalogWriteGuard)
  async releaseExpiredReservations() {
    return this.releaseExpiredReservationsUseCase.execute();
  }
}
