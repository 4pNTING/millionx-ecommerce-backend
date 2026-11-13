import { Inject, UseGuards } from '@nestjs/common';
import { Args, Context, Mutation, Query, Resolver } from '@nestjs/graphql';
import { JwtAuthGuard } from '../../common/jwt-auth.guard';
import { CustomerAccountGuard } from '../../common/customer-account.guard';
import { WishlistUsecasesProxyModule } from '../../usecases-proxy/wishlist-usecases-proxy.module';
import { LoadWishlistUseCase } from '../../../usecases/wishlist/loadWishlist.usecase';
import { AddToWishlistUseCase } from '../../../usecases/wishlist/addToWishlist.usecase';
import { RemoveFromWishlistUseCase } from '../../../usecases/wishlist/removeFromWishlist.usecase';
import { AddToWishlistDto, RemoveFromWishlistDto, Wishlist } from './wishlist.model';

interface CustomerContext {
  req: { user: { customerId: string } };
}

@Resolver(() => Wishlist)
export class WishlistResolver {
  constructor(
    @Inject(WishlistUsecasesProxyModule.LOAD_WISHLIST_PROXY)
    private readonly loadWishlistUseCase: LoadWishlistUseCase,
    @Inject(WishlistUsecasesProxyModule.ADD_TO_WISHLIST_PROXY)
    private readonly addToWishlistUseCase: AddToWishlistUseCase,
    @Inject(WishlistUsecasesProxyModule.REMOVE_FROM_WISHLIST_PROXY)
    private readonly removeFromWishlistUseCase: RemoveFromWishlistUseCase,
  ) {}

  @Query(() => Wishlist)
  @UseGuards(JwtAuthGuard, CustomerAccountGuard)
  async myWishlist(@Context() context: CustomerContext) {
    return this.loadWishlistUseCase.execute(context.req.user.customerId);
  }

  @Mutation(() => Wishlist)
  @UseGuards(JwtAuthGuard, CustomerAccountGuard)
  async addToWishlist(@Context() context: CustomerContext, @Args('input') input: AddToWishlistDto) {
    return this.addToWishlistUseCase.execute({
      customerId: context.req.user.customerId,
      productId: input.productId,
    });
  }

  @Mutation(() => Wishlist)
  @UseGuards(JwtAuthGuard, CustomerAccountGuard)
  async removeFromWishlist(
    @Context() context: CustomerContext,
    @Args('input') input: RemoveFromWishlistDto,
  ) {
    return this.removeFromWishlistUseCase.execute({
      customerId: context.req.user.customerId,
      productId: input.productId,
    });
  }
}
