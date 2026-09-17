import { DynamicModule, Module } from '@nestjs/common';
import { AddCatalogProductImageUseCase } from '../../usecases/product/addCatalogProductImage.usecase';
import { CreateCatalogProductUseCase } from '../../usecases/product/createCatalogProduct.usecase';
import { CreateCatalogProductBundleUseCase } from '../../usecases/product/createCatalogProductBundle.usecase';
import { CreateCatalogVariantUseCase } from '../../usecases/product/createCatalogVariant.usecase';
import { DeleteCatalogProductImageUseCase } from '../../usecases/product/deleteCatalogProductImage.usecase';
import { LoadCatalogProductUseCase } from '../../usecases/product/loadCatalogProduct.usecase';
import { LoadCatalogProductsUseCase } from '../../usecases/product/loadCatalogProducts.usecase';
import { SetCatalogProductPriceUseCase } from '../../usecases/product/setCatalogProductPrice.usecase';
import { UpdateCatalogProductUseCase } from '../../usecases/product/updateCatalogProduct.usecase';
import { UpdateCatalogProductImageUseCase } from '../../usecases/product/updateCatalogProductImage.usecase';
import { DatabaseProductRepository } from '../repositories/product/product.repository';
import { RepositoriesModule } from '../repositories/repositories.module';

@Module({ imports: [RepositoriesModule] })
export class ProductUsecasesProxyModule {
  static readonly LOAD_PRODUCTS_PROXY = 'LoadCatalogProductsProxy';
  static readonly LOAD_PRODUCT_PROXY = 'LoadCatalogProductProxy';
  static readonly CREATE_PRODUCT_PROXY = 'CreateCatalogProductProxy';
  static readonly CREATE_PRODUCT_BUNDLE_PROXY = 'CreateCatalogProductBundleProxy';
  static readonly UPDATE_PRODUCT_PROXY = 'UpdateCatalogProductProxy';
  static readonly CREATE_VARIANT_PROXY = 'CreateCatalogVariantProxy';
  static readonly SET_PRICE_PROXY = 'SetCatalogProductPriceProxy';
  static readonly ADD_IMAGE_PROXY = 'AddCatalogProductImageProxy';
  static readonly UPDATE_IMAGE_PROXY = 'UpdateCatalogProductImageProxy';
  static readonly DELETE_IMAGE_PROXY = 'DeleteCatalogProductImageProxy';

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
        {
          provide: this.CREATE_PRODUCT_BUNDLE_PROXY,
          ...factory(CreateCatalogProductBundleUseCase),
        },
        { provide: this.UPDATE_PRODUCT_PROXY, ...factory(UpdateCatalogProductUseCase) },
        { provide: this.CREATE_VARIANT_PROXY, ...factory(CreateCatalogVariantUseCase) },
        { provide: this.SET_PRICE_PROXY, ...factory(SetCatalogProductPriceUseCase) },
        { provide: this.ADD_IMAGE_PROXY, ...factory(AddCatalogProductImageUseCase) },
        { provide: this.UPDATE_IMAGE_PROXY, ...factory(UpdateCatalogProductImageUseCase) },
        { provide: this.DELETE_IMAGE_PROXY, ...factory(DeleteCatalogProductImageUseCase) },
      ],
      exports: [
        this.LOAD_PRODUCTS_PROXY,
        this.LOAD_PRODUCT_PROXY,
        this.CREATE_PRODUCT_PROXY,
        this.CREATE_PRODUCT_BUNDLE_PROXY,
        this.UPDATE_PRODUCT_PROXY,
        this.CREATE_VARIANT_PROXY,
        this.SET_PRICE_PROXY,
        this.ADD_IMAGE_PROXY,
        this.UPDATE_IMAGE_PROXY,
        this.DELETE_IMAGE_PROXY,
      ],
    };
  }
}
