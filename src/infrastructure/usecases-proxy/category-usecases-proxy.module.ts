import { DynamicModule, Module } from '@nestjs/common';
import { CreateCatalogCategoryUseCase } from '../../usecases/category/createCatalogCategory.usecase';
import { LoadCatalogCategoriesUseCase } from '../../usecases/category/loadCatalogCategories.usecase';
import { UpdateCatalogCategoryUseCase } from '../../usecases/category/updateCatalogCategory.usecase';
import { DatabaseCategoryRepository } from '../repositories/category/category.repository';
import { RepositoriesModule } from '../repositories/repositories.module';

@Module({ imports: [RepositoriesModule] })
export class CategoryUsecasesProxyModule {
  static readonly LOAD_CATEGORIES_PROXY = 'LoadCatalogCategoriesProxy';
  static readonly CREATE_CATEGORY_PROXY = 'CreateCatalogCategoryProxy';
  static readonly UPDATE_CATEGORY_PROXY = 'UpdateCatalogCategoryProxy';

  static register(): DynamicModule {
    const factory = (UseCase: new (repository: DatabaseCategoryRepository) => unknown) => ({
      inject: [DatabaseCategoryRepository],
      useFactory: (repository: DatabaseCategoryRepository) => new UseCase(repository),
    });

    return {
      module: CategoryUsecasesProxyModule,
      providers: [
        {
          provide: this.LOAD_CATEGORIES_PROXY,
          ...factory(LoadCatalogCategoriesUseCase),
        },
        {
          provide: this.CREATE_CATEGORY_PROXY,
          ...factory(CreateCatalogCategoryUseCase),
        },
        {
          provide: this.UPDATE_CATEGORY_PROXY,
          ...factory(UpdateCatalogCategoryUseCase),
        },
      ],
      exports: [this.LOAD_CATEGORIES_PROXY, this.CREATE_CATEGORY_PROXY, this.UPDATE_CATEGORY_PROXY],
    };
  }
}
