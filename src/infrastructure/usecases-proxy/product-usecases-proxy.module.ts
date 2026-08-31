import { DynamicModule, Module } from '@nestjs/common';
import { AddCatalogProductImageUseCase } from '../../usecases/product/addCatalogProductImage.usecase';
import { CreateCatalogProductUseCase } from '../../usecases/product/createCatalogProduct.usecase';
import { CreateCatalogVariantUseCase } from '../../usecases/product/createCatalogVariant.usecase';
import { LoadCatalogProductUseCase } from '../../usecases/product/loadCatalogProduct.usecase';
import { LoadCatalogProductsUseCase } from '../../usecases/product/loadCatalogProducts.usecase';
import { SetCatalogProductPriceUseCase } from '../../usecases/product/setCatalogProductPrice.usecase';
import { UpdateCatalogProductUseCase } from '../../usecases/product/updateCatalogProduct.usecase';
import { DatabaseProductRepository } from '../repositories/product/product.repository';
import { RepositoriesModule } from '../repositories/repositories.module';

@Module({ imports: [RepositoriesModule] })
export class ProductUsecasesProxyModule {
  static readonly LOAD_PRODUCTS_PROXY = 'LoadCatalogProductsProxy';
  static readonly LOAD_PRODUCT_PROXY = 'LoadCatalogProductProxy';
  static readonly CREATE_PRODUCT_PROXY = 'CreateCatalogProductProxy';
  static readonly UPDATE_PRODUCT_PROXY = 'UpdateCatalogProductProxy';
  static readonly CREATE_VARIANT_PROXY = 'CreateCatalogVariantProxy';
  static readonly SET_PRICE_PROXY = 'SetCatalogProductPriceProxy';
  static readonly ADD_IMAGE_PROXY = 'AddCatalogProductImageProxy';

  static register(): DynamicModule {
    const factory = (UseCase: new (repository: DatabaseProductRepository) => unknown) => ({
      inject: [DatabaseProductRepository],
      useFactory: (repository: DatabaseProductRepository) => new UseCase(repository),
    });

    return {
      module: ProductUsecasesProxyModule,
      providers: [
        { provide: this.LOAD_PRODUCTS_PROXY, ...factory(LoadCatalogProductsUseCase) },
        { provide: this.LOAD_PRODUCT_PROXY, ...factory(LoadCatalogProductUseCase) },
        { provide: this.CREATE_PRODUCT_PROXY, ...factory(CreateCatalogProductUseCase) },
        { provide: this.UPDATE_PRODUCT_PROXY, ...factory(UpdateCatalogProductUseCase) },
        { provide: this.CREATE_VARIANT_PROXY, ...factory(CreateCatalogVariantUseCase) },
        { provide: this.SET_PRICE_PROXY, ...factory(SetCatalogProductPriceUseCase) },
        { provide: this.ADD_IMAGE_PROXY, ...factory(AddCatalogProductImageUseCase) },
      ],
      exports: [
        this.LOAD_PRODUCTS_PROXY,
        this.LOAD_PRODUCT_PROXY,
        this.CREATE_PRODUCT_PROXY,
        this.UPDATE_PRODUCT_PROXY,
        this.CREATE_VARIANT_PROXY,
        this.SET_PRICE_PROXY,
        this.ADD_IMAGE_PROXY,
      ],
    };
  }
}
