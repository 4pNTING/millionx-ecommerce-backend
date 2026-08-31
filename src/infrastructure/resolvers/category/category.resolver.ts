import { Inject, UseGuards } from '@nestjs/common';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { CreateCatalogCategoryUseCase } from '../../../usecases/category/createCatalogCategory.usecase';
import { LoadCatalogCategoriesUseCase } from '../../../usecases/category/loadCatalogCategories.usecase';
import { UpdateCatalogCategoryUseCase } from '../../../usecases/category/updateCatalogCategory.usecase';
import { CatalogWriteGuard } from '../../common/catalog-write.guard';
import { JwtAuthGuard } from '../../common/jwt-auth.guard';
import { CategoryUsecasesProxyModule } from '../../usecases-proxy/category-usecases-proxy.module';
import {
  Category,
  CategoryFilterInput,
  CategoryPage,
  CreateCategoryInput,
  UpdateCategoryInput,
  CatalogCategoryFilterDto,
  CreateCatalogCategoryDto,
  UpdateCatalogCategoryDto,
} from './category.model';

@Resolver(() => Category)
export class CategoryResolver {
  constructor(
    @Inject(CategoryUsecasesProxyModule.LOAD_CATEGORIES_PROXY)
    private readonly loadCategoriesUseCase: LoadCatalogCategoriesUseCase,
    @Inject(CategoryUsecasesProxyModule.CREATE_CATEGORY_PROXY)
    private readonly createCategoryUseCase: CreateCatalogCategoryUseCase,
    @Inject(CategoryUsecasesProxyModule.UPDATE_CATEGORY_PROXY)
    private readonly updateCategoryUseCase: UpdateCatalogCategoryUseCase,
  ) {}

  @Query(() => CategoryPage)
  categories(@Args('filter', { nullable: true }) filter?: CategoryFilterInput) {
    return this.loadCategoriesUseCase.execute(filter);
  }

  @Mutation(() => Category)
  @UseGuards(JwtAuthGuard, CatalogWriteGuard)
  createCategory(@Args('input') input: CreateCategoryInput) {
    return this.createCategoryUseCase.execute(input);
  }

  @Mutation(() => Category)
  @UseGuards(JwtAuthGuard, CatalogWriteGuard)
  updateCategory(@Args('input') input: UpdateCategoryInput) {
    return this.updateCategoryUseCase.execute(input);
  }

  // Backward compatibility legacy queries & mutations
  @Query(() => CategoryPage, { deprecationReason: 'Use categories instead' })
  catalogCategories(@Args('filter', { nullable: true }) filter?: CatalogCategoryFilterDto) {
    return this.categories(filter);
  }

  @Mutation(() => Category, { deprecationReason: 'Use createCategory instead' })
  @UseGuards(JwtAuthGuard, CatalogWriteGuard)
  createCatalogCategory(@Args('input') input: CreateCatalogCategoryDto) {
    return this.createCategory(input);
  }

  @Mutation(() => Category, { deprecationReason: 'Use updateCategory instead' })
  @UseGuards(JwtAuthGuard, CatalogWriteGuard)
  updateCatalogCategory(@Args('input') input: UpdateCatalogCategoryDto) {
    return this.updateCategory(input);
  }
}
