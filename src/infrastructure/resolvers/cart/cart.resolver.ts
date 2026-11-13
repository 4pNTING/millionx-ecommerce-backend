import { Inject, UseGuards } from '@nestjs/common';
import { Args, Context, Mutation, Query, Resolver } from '@nestjs/graphql';
import { OptionalJwtAuthGuard } from '../../common/optional-jwt-auth.guard';
import { JwtAuthGuard } from '../../common/jwt-auth.guard';
import { CustomerAccountGuard } from '../../common/customer-account.guard';
import { CartUsecasesProxyModule } from '../../usecases-proxy/cart-usecases-proxy.module';
import { LoadCartUseCase } from '../../../usecases/cart/loadCart.usecase';
import { AddToCartUseCase } from '../../../usecases/cart/addToCart.usecase';
import { UpdateCartItemUseCase } from '../../../usecases/cart/updateCartItem.usecase';
import { RemoveCartItemUseCase } from '../../../usecases/cart/removeCartItem.usecase';
import { ClearCartUseCase } from '../../../usecases/cart/clearCart.usecase';
import { MergeGuestCartUseCase } from '../../../usecases/cart/mergeGuestCart.usecase';
import {
  AddToCartDto,
  Cart,
  MergeGuestCartDto,
  RemoveCartItemDto,
  UpdateCartItemDto,
} from './cart.model';

interface RequestContext {
  req: {
    user?: { customerId?: string; actorType?: string };
    headers?: Record<string, string>;
  };
}

@Resolver(() => Cart)
export class CartResolver {
  constructor(
    @Inject(CartUsecasesProxyModule.LOAD_CART_PROXY)
    private readonly loadCartUseCase: LoadCartUseCase,
    @Inject(CartUsecasesProxyModule.ADD_TO_CART_PROXY)
    private readonly addToCartUseCase: AddToCartUseCase,
    @Inject(CartUsecasesProxyModule.UPDATE_CART_ITEM_PROXY)
    private readonly updateCartItemUseCase: UpdateCartItemUseCase,
    @Inject(CartUsecasesProxyModule.REMOVE_CART_ITEM_PROXY)
    private readonly removeCartItemUseCase: RemoveCartItemUseCase,
    @Inject(CartUsecasesProxyModule.CLEAR_CART_PROXY)
    private readonly clearCartUseCase: ClearCartUseCase,
    @Inject(CartUsecasesProxyModule.MERGE_GUEST_CART_PROXY)
    private readonly mergeGuestCartUseCase: MergeGuestCartUseCase,
  ) {}

  private extractActor(context: RequestContext, inputSessionId?: string) {
    const customerId =
      context.req?.user?.actorType === 'customer' ? context.req?.user?.customerId : undefined;
    const sessionId = inputSessionId || context.req?.headers?.['x-session-id'] || undefined;
    return { customerId, sessionId };
  }

  @Query(() => Cart, { nullable: true })
  @UseGuards(OptionalJwtAuthGuard)
  async myCart(
    @Context() context: RequestContext,
    @Args('sessionId', { nullable: true }) sessionId?: string,
  ) {
    const actor = this.extractActor(context, sessionId);
    return this.loadCartUseCase.execute(actor.customerId, actor.sessionId);
  }

  @Mutation(() => Cart)
  @UseGuards(OptionalJwtAuthGuard)
  async addToCart(@Context() context: RequestContext, @Args('input') input: AddToCartDto) {
    const actor = this.extractActor(context, input.sessionId);
    return this.addToCartUseCase.execute({
      variantId: input.variantId,
      quantity: input.quantity,
      customerId: actor.customerId,
      sessionId: actor.sessionId,
    });
  }

  @Mutation(() => Cart)
  @UseGuards(OptionalJwtAuthGuard)
  async updateCartItem(
    @Context() context: RequestContext,
    @Args('input') input: UpdateCartItemDto,
  ) {
    const actor = this.extractActor(context, input.sessionId);
    return this.updateCartItemUseCase.execute({
      cartItemId: input._id,
      quantity: input.quantity,
      customerId: actor.customerId,
      sessionId: actor.sessionId,
    });
  }

  @Mutation(() => Cart)
  @UseGuards(OptionalJwtAuthGuard)
  async removeCartItem(
    @Context() context: RequestContext,
    @Args('input') input: RemoveCartItemDto,
  ) {
    const actor = this.extractActor(context, input.sessionId);
    return this.removeCartItemUseCase.execute({
      cartItemId: input._id,
      customerId: actor.customerId,
      sessionId: actor.sessionId,
    });
  }

  @Mutation(() => Boolean)
  @UseGuards(OptionalJwtAuthGuard)
  async clearCart(
    @Context() context: RequestContext,
    @Args('sessionId', { nullable: true }) sessionId?: string,
  ) {
    const actor = this.extractActor(context, sessionId);
    return this.clearCartUseCase.execute(actor.customerId, actor.sessionId);
  }

  @Mutation(() => Cart)
  @UseGuards(JwtAuthGuard, CustomerAccountGuard)
  async mergeGuestCart(
    @Context() context: RequestContext,
    @Args('input') input: MergeGuestCartDto,
  ) {
    const customerId = context.req.user!.customerId!;
    return this.mergeGuestCartUseCase.execute({
      sessionId: input.sessionId,
      customerId,
    });
  }
}
