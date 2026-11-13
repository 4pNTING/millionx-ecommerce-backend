import { Inject, UseGuards } from '@nestjs/common';
import { Args, Context, Mutation, Query, Resolver } from '@nestjs/graphql';
import { OptionalJwtAuthGuard } from '../../common/optional-jwt-auth.guard';
import { CheckoutUsecasesProxyModule } from '../../usecases-proxy/checkout-usecases-proxy.module';
import { CreateCheckoutSessionUseCase } from '../../../usecases/checkout/createCheckoutSession.usecase';
import { GetCheckoutSessionUseCase } from '../../../usecases/checkout/getCheckoutSession.usecase';
import { CheckoutSession, CreateCheckoutSessionDto } from './checkout.model';

interface RequestContext {
  req: {
    user?: { customerId?: string; actorType?: string };
    headers?: Record<string, string>;
  };
}

@Resolver(() => CheckoutSession)
export class CheckoutResolver {
  constructor(
    @Inject(CheckoutUsecasesProxyModule.CREATE_CHECKOUT_SESSION_PROXY)
    private readonly createCheckoutSessionUseCase: CreateCheckoutSessionUseCase,
    @Inject(CheckoutUsecasesProxyModule.GET_CHECKOUT_SESSION_PROXY)
    private readonly getCheckoutSessionUseCase: GetCheckoutSessionUseCase,
  ) {}

  @Mutation(() => CheckoutSession)
  @UseGuards(OptionalJwtAuthGuard)
  async createCheckoutSession(
    @Context() context: RequestContext,
    @Args('input', { nullable: true }) input?: CreateCheckoutSessionDto,
  ) {
    const customerId =
      context.req?.user?.actorType === 'customer' ? context.req?.user?.customerId : undefined;
    const sessionId = input?.sessionId || context.req?.headers?.['x-session-id'] || undefined;

    return this.createCheckoutSessionUseCase.execute({
      cartId: input?.cartId,
      customerId,
      sessionId,
      shippingAmount: input?.shippingAmount,
      taxAmount: input?.taxAmount,
      discountAmount: input?.discountAmount,
    });
  }

  @Query(() => CheckoutSession, { nullable: true })
  @UseGuards(OptionalJwtAuthGuard)
  async checkoutSession(@Context() context: RequestContext, @Args('_id') _id: string) {
    const customerId =
      context.req?.user?.actorType === 'customer' ? context.req?.user?.customerId : undefined;
    return this.getCheckoutSessionUseCase.execute(_id, customerId);
  }
}
