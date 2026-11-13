import { DynamicModule, Module } from '@nestjs/common';
import { RepositoriesModule } from '../repositories/repositories.module';
import { DatabaseCartRepository } from '../repositories/cart/cart.repository';
import { GetOrCreateCartUseCase } from '../../usecases/cart/getOrCreateCart.usecase';
import { LoadCartUseCase } from '../../usecases/cart/loadCart.usecase';
import { AddToCartUseCase } from '../../usecases/cart/addToCart.usecase';
import { UpdateCartItemUseCase } from '../../usecases/cart/updateCartItem.usecase';
import { RemoveCartItemUseCase } from '../../usecases/cart/removeCartItem.usecase';
import { ClearCartUseCase } from '../../usecases/cart/clearCart.usecase';
import { MergeGuestCartUseCase } from '../../usecases/cart/mergeGuestCart.usecase';

@Module({ imports: [RepositoriesModule] })
export class CartUsecasesProxyModule {
  static GET_OR_CREATE_CART_PROXY = 'GetOrCreateCartProxy';
  static LOAD_CART_PROXY = 'LoadCartProxy';
  static ADD_TO_CART_PROXY = 'AddToCartProxy';
  static UPDATE_CART_ITEM_PROXY = 'UpdateCartItemProxy';
  static REMOVE_CART_ITEM_PROXY = 'RemoveCartItemProxy';
  static CLEAR_CART_PROXY = 'ClearCartProxy';
  static MERGE_GUEST_CART_PROXY = 'MergeGuestCartProxy';

  static register(): DynamicModule {
    const factory = (UseCase: new (repository: DatabaseCartRepository) => unknown) => ({
      inject: [DatabaseCartRepository],
      useFactory: (repository: DatabaseCartRepository) => new UseCase(repository),
    });

    return {
      module: CartUsecasesProxyModule,
      providers: [
        { provide: this.GET_OR_CREATE_CART_PROXY, ...factory(GetOrCreateCartUseCase) },
        { provide: this.LOAD_CART_PROXY, ...factory(LoadCartUseCase) },
        { provide: this.ADD_TO_CART_PROXY, ...factory(AddToCartUseCase) },
        { provide: this.UPDATE_CART_ITEM_PROXY, ...factory(UpdateCartItemUseCase) },
        { provide: this.REMOVE_CART_ITEM_PROXY, ...factory(RemoveCartItemUseCase) },
        { provide: this.CLEAR_CART_PROXY, ...factory(ClearCartUseCase) },
        { provide: this.MERGE_GUEST_CART_PROXY, ...factory(MergeGuestCartUseCase) },
      ],
      exports: [
        this.GET_OR_CREATE_CART_PROXY,
        this.LOAD_CART_PROXY,
        this.ADD_TO_CART_PROXY,
        this.UPDATE_CART_ITEM_PROXY,
        this.REMOVE_CART_ITEM_PROXY,
        this.CLEAR_CART_PROXY,
        this.MERGE_GUEST_CART_PROXY,
      ],
    };
  }
}
