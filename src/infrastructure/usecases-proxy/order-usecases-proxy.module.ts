import { DynamicModule, Module } from '@nestjs/common';
import { RepositoriesModule } from '../repositories/repositories.module';
import { DatabaseOrderRepository } from '../repositories/order/order.repository';
import { CreateOrderUseCase } from '../../usecases/order/createOrder.usecase';
import { LoadOrdersUseCase } from '../../usecases/order/loadOrders.usecase';
import { LoadOrderByIdUseCase } from '../../usecases/order/loadOrderById.usecase';
import { CancelOrderUseCase } from '../../usecases/order/cancelOrder.usecase';
import { UpdateOrderStatusUseCase } from '../../usecases/order/updateOrderStatus.usecase';

@Module({ imports: [RepositoriesModule] })
export class OrderUsecasesProxyModule {
  static CREATE_ORDER_PROXY = 'CreateOrderProxy';
  static LOAD_ORDERS_PROXY = 'LoadOrdersProxy';
  static LOAD_ORDER_BY_ID_PROXY = 'LoadOrderByIdProxy';
  static CANCEL_ORDER_PROXY = 'CancelOrderProxy';
  static UPDATE_ORDER_STATUS_PROXY = 'UpdateOrderStatusProxy';

  static register(): DynamicModule {
    const factory = (UseCase: new (repository: DatabaseOrderRepository) => unknown) => ({
      inject: [DatabaseOrderRepository],
      useFactory: (repository: DatabaseOrderRepository) => new UseCase(repository),
    });

    return {
      module: OrderUsecasesProxyModule,
      providers: [
        { provide: this.CREATE_ORDER_PROXY, ...factory(CreateOrderUseCase) },
        { provide: this.LOAD_ORDERS_PROXY, ...factory(LoadOrdersUseCase) },
        { provide: this.LOAD_ORDER_BY_ID_PROXY, ...factory(LoadOrderByIdUseCase) },
        { provide: this.CANCEL_ORDER_PROXY, ...factory(CancelOrderUseCase) },
        { provide: this.UPDATE_ORDER_STATUS_PROXY, ...factory(UpdateOrderStatusUseCase) },
      ],
      exports: [
        this.CREATE_ORDER_PROXY,
        this.LOAD_ORDERS_PROXY,
        this.LOAD_ORDER_BY_ID_PROXY,
        this.CANCEL_ORDER_PROXY,
        this.UPDATE_ORDER_STATUS_PROXY,
      ],
    };
  }
}
