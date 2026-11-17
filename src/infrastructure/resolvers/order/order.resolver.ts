import { BadRequestException, Inject, UseGuards } from '@nestjs/common';
import { Args, Context, Mutation, Query, Resolver } from '@nestjs/graphql';
import { JwtAuthGuard } from '../../common/jwt-auth.guard';
import { CustomerAccountGuard } from '../../common/customer-account.guard';
import { CatalogWriteGuard } from '../../common/catalog-write.guard';
import { OrderUsecasesProxyModule } from '../../usecases-proxy/order-usecases-proxy.module';
import { CreateOrderUseCase } from '../../../usecases/order/createOrder.usecase';
import { LoadOrdersUseCase } from '../../../usecases/order/loadOrders.usecase';
import { LoadOrderByIdUseCase } from '../../../usecases/order/loadOrderById.usecase';
import { CancelOrderUseCase } from '../../../usecases/order/cancelOrder.usecase';
import { UpdateOrderStatusUseCase } from '../../../usecases/order/updateOrderStatus.usecase';
import {
  CancelOrderDto,
  CreateOrderDto,
  LoadOrderDto,
  Order,
  OrderListPayload,
  UpdateOrderStatusDto,
} from './order.model';
import { OrderStatus } from '../../../domain/models/order.model';

interface RequestContext {
  req: {
    user?: { customerId?: string; actorType?: string; username?: string };
    headers?: Record<string, string>;
  };
}

@Resolver(() => Order)
export class OrderResolver {
  constructor(
    @Inject(OrderUsecasesProxyModule.CREATE_ORDER_PROXY)
    private readonly createOrderUseCase: CreateOrderUseCase,
    @Inject(OrderUsecasesProxyModule.LOAD_ORDERS_PROXY)
    private readonly loadOrdersUseCase: LoadOrdersUseCase,
    @Inject(OrderUsecasesProxyModule.LOAD_ORDER_BY_ID_PROXY)
    private readonly loadOrderByIdUseCase: LoadOrderByIdUseCase,
    @Inject(OrderUsecasesProxyModule.CANCEL_ORDER_PROXY)
    private readonly cancelOrderUseCase: CancelOrderUseCase,
    @Inject(OrderUsecasesProxyModule.UPDATE_ORDER_STATUS_PROXY)
    private readonly updateOrderStatusUseCase: UpdateOrderStatusUseCase,
  ) {}

  @Mutation(() => Order)
  @UseGuards(JwtAuthGuard, CustomerAccountGuard)
  async createOrder(
    @Context() context: RequestContext,
    @Args('input') input: CreateOrderDto,
  ) {
    const customerId = context.req?.user?.customerId;
    if (!customerId) {
      throw new BadRequestException('Customer token required to create order');
    }

    return this.createOrderUseCase.execute({
      customerId,
      checkoutSessionId: input.checkoutSessionId,
      shippingAddress: input.shippingAddress,
      billingAddress: input.billingAddress,
      notes: input.notes,
    });
  }

  @Query(() => OrderListPayload)
  @UseGuards(JwtAuthGuard, CustomerAccountGuard)
  async myOrders(
    @Context() context: RequestContext,
    @Args('input', { nullable: true }) input?: LoadOrderDto,
  ) {
    const customerId = context.req?.user?.customerId;
    if (!customerId) {
      throw new BadRequestException('Customer token required to fetch orders');
    }

    return this.loadOrdersUseCase.execute({
      customerId,
      status: input?.status,
      page: input?.page ?? 1,
      limit: input?.limit ?? 20,
    });
  }

  @Query(() => Order, { nullable: true })
  @UseGuards(JwtAuthGuard)
  async order(@Context() context: RequestContext, @Args('_id') _id: string) {
    const isCustomer = context.req?.user?.actorType === 'customer';
    const customerId = isCustomer ? context.req?.user?.customerId : undefined;
    return this.loadOrderByIdUseCase.execute(_id, customerId);
  }

  @Mutation(() => Order)
  @UseGuards(JwtAuthGuard, CustomerAccountGuard)
  async cancelOrder(
    @Context() context: RequestContext,
    @Args('input') input: CancelOrderDto,
  ) {
    const customerId = context.req?.user?.customerId;
    if (!customerId) {
      throw new BadRequestException('Customer token required to cancel order');
    }

    return this.cancelOrderUseCase.execute(input._id, customerId, input.reason);
  }

  @Mutation(() => Order)
  @UseGuards(JwtAuthGuard, CatalogWriteGuard)
  async updateOrderStatus(
    @Context() context: RequestContext,
    @Args('input') input: UpdateOrderStatusDto,
  ) {
    const changedBy = context.req?.user?.username || 'staff';
    return this.updateOrderStatusUseCase.execute(
      input._id,
      input.status as OrderStatus,
      input.note,
      changedBy,
    );
  }
}
