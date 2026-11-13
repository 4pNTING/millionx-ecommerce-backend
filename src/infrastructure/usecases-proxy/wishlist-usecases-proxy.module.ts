import { DynamicModule, Module } from '@nestjs/common';
import { RepositoriesModule } from '../repositories/repositories.module';
import { DatabaseWishlistRepository } from '../repositories/wishlist/wishlist.repository';
import { LoadWishlistUseCase } from '../../usecases/wishlist/loadWishlist.usecase';
import { AddToWishlistUseCase } from '../../usecases/wishlist/addToWishlist.usecase';
import { RemoveFromWishlistUseCase } from '../../usecases/wishlist/removeFromWishlist.usecase';

@Module({ imports: [RepositoriesModule] })
export class WishlistUsecasesProxyModule {
  static LOAD_WISHLIST_PROXY = 'LoadWishlistProxy';
  static ADD_TO_WISHLIST_PROXY = 'AddToWishlistProxy';
  static REMOVE_FROM_WISHLIST_PROXY = 'RemoveFromWishlistProxy';

  static register(): DynamicModule {
    const factory = (UseCase: new (repository: DatabaseWishlistRepository) => unknown) => ({
      inject: [DatabaseWishlistRepository],
      useFactory: (repository: DatabaseWishlistRepository) => new UseCase(repository),
    });

    return {
      module: WishlistUsecasesProxyModule,
      providers: [
        { provide: this.LOAD_WISHLIST_PROXY, ...factory(LoadWishlistUseCase) },
        { provide: this.ADD_TO_WISHLIST_PROXY, ...factory(AddToWishlistUseCase) },
        { provide: this.REMOVE_FROM_WISHLIST_PROXY, ...factory(RemoveFromWishlistUseCase) },
      ],
      exports: [
        this.LOAD_WISHLIST_PROXY,
        this.ADD_TO_WISHLIST_PROXY,
        this.REMOVE_FROM_WISHLIST_PROXY,
      ],
    };
  }
}
