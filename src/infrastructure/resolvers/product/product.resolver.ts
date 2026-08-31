import { Inject, UseGuards } from '@nestjs/common';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { AddCatalogProductImageUseCase } from '../../../usecases/product/addCatalogProductImage.usecase';
import { CreateCatalogProductUseCase } from '../../../usecases/product/createCatalogProduct.usecase';
import { CreateCatalogVariantUseCase } from '../../../usecases/product/createCatalogVariant.usecase';
import { LoadCatalogProductUseCase } from '../../../usecases/product/loadCatalogProduct.usecase';
import { LoadCatalogProductsUseCase } from '../../../usecases/product/loadCatalogProducts.usecase';
import { SetCatalogProductPriceUseCase } from '../../../usecases/product/setCatalogProductPrice.usecase';
import { UpdateCatalogProductUseCase } from '../../../usecases/product/updateCatalogProduct.usecase';
import { CatalogWriteGuard } from '../../common/catalog-write.guard';
import { JwtAuthGuard } from '../../common/jwt-auth.guard';
import { ProductUsecasesProxyModule } from '../../usecases-proxy/product-usecases-proxy.module';
import {
  AddProductImageInput,
  CreateProductInput,
  CreateProductVariantInput,
  Product,
  ProductFilterInput,
  ProductPage,
  ProductVariant,
  SetProductPriceInput,
  UpdateProductInput,
  CatalogProductFilterDto,
  CreateCatalogProductDto,
  UpdateCatalogProductDto,
  CreateCatalogVariantDto,
  SetCatalogProductPriceDto,
  AddCatalogProductImageDto,
} from './product.model';

@Resolver(() => Product)
export class ProductResolver {
  constructor(
    @Inject(ProductUsecasesProxyModule.LOAD_PRODUCTS_PROXY)
    private readonly loadProductsUseCase: LoadCatalogProductsUseCase,
    @Inject(ProductUsecasesProxyModule.LOAD_PRODUCT_PROXY)
    private readonly loadProductUseCase: LoadCatalogProductUseCase,
    @Inject(ProductUsecasesProxyModule.CREATE_PRODUCT_PROXY)
    private readonly createProductUseCase: CreateCatalogProductUseCase,
    @Inject(ProductUsecasesProxyModule.UPDATE_PRODUCT_PROXY)
    private readonly updateProductUseCase: UpdateCatalogProductUseCase,
    @Inject(ProductUsecasesProxyModule.CREATE_VARIANT_PROXY)
    private readonly createVariantUseCase: CreateCatalogVariantUseCase,
    @Inject(ProductUsecasesProxyModule.SET_PRICE_PROXY)
    private readonly setPriceUseCase: SetCatalogProductPriceUseCase,
    @Inject(ProductUsecasesProxyModule.ADD_IMAGE_PROXY)
    private readonly addImageUseCase: AddCatalogProductImageUseCase,
  ) {}

  @Query(() => ProductPage)
  products(@Args('filter', { nullable: true }) filter?: ProductFilterInput) {
    return this.loadProductsUseCase.execute(filter);
  }

  @Query(() => Product)
  product(
    @Args('id', { nullable: true }) id?: string,
    @Args('slug', { nullable: true }) slug?: string,
    @Args('currency', { nullable: true }) currency?: string,
  ) {
    return this.loadProductUseCase.execute(id, slug, currency);
  }

  @Mutation(() => Product)
  @UseGuards(JwtAuthGuard, CatalogWriteGuard)
  createProduct(@Args('input') input: CreateProductInput) {
    return this.createProductUseCase.execute(input);
  }

  @Mutation(() => Product)
  @UseGuards(JwtAuthGuard, CatalogWriteGuard)
  updateProduct(@Args('input') input: UpdateProductInput) {
    return this.updateProductUseCase.execute(input);
  }

  @Mutation(() => ProductVariant)
  @UseGuards(JwtAuthGuard, CatalogWriteGuard)
  createProductVariant(@Args('input') input: CreateProductVariantInput) {
    return this.createVariantUseCase.execute(input);
  }

  @Mutation(() => Product)
  @UseGuards(JwtAuthGuard, CatalogWriteGuard)
  setProductPrice(@Args('input') input: SetProductPriceInput) {
    return this.setPriceUseCase.execute(input);
  }

  @Mutation(() => Product)
  @UseGuards(JwtAuthGuard, CatalogWriteGuard)
  addProductImage(@Args('input') input: AddProductImageInput) {
    return this.addImageUseCase.execute(input);
  }

  // Backward compatibility legacy queries & mutations
  @Query(() => ProductPage, { deprecationReason: 'Use products instead' })
  catalogProducts(@Args('filter', { nullable: true }) filter?: CatalogProductFilterDto) {
    return this.products(filter);
  }

  @Query(() => Product, { deprecationReason: 'Use product instead' })
  catalogProduct(
    @Args('id', { nullable: true }) id?: string,
    @Args('slug', { nullable: true }) slug?: string,
    @Args('currency', { nullable: true }) currency?: string,
  ) {
    return this.product(id, slug, currency);
  }

  @Mutation(() => Product, { deprecationReason: 'Use createProduct instead' })
  @UseGuards(JwtAuthGuard, CatalogWriteGuard)
  createCatalogProduct(@Args('input') input: CreateCatalogProductDto) {
    return this.createProduct(input);
  }

  @Mutation(() => Product, { deprecationReason: 'Use updateProduct instead' })
  @UseGuards(JwtAuthGuard, CatalogWriteGuard)
  updateCatalogProduct(@Args('input') input: UpdateCatalogProductDto) {
    return this.updateProduct(input);
  }

  @Mutation(() => ProductVariant, { deprecationReason: 'Use createProductVariant instead' })
  @UseGuards(JwtAuthGuard, CatalogWriteGuard)
  createCatalogVariant(@Args('input') input: CreateCatalogVariantDto) {
    return this.createProductVariant(input);
  }

  @Mutation(() => Product, { deprecationReason: 'Use setProductPrice instead' })
  @UseGuards(JwtAuthGuard, CatalogWriteGuard)
  setCatalogProductPrice(@Args('input') input: SetCatalogProductPriceDto) {
    return this.setProductPrice(input);
  }

  @Mutation(() => Product, { deprecationReason: 'Use addProductImage instead' })
  @UseGuards(JwtAuthGuard, CatalogWriteGuard)
  addCatalogProductImage(@Args('input') input: AddCatalogProductImageDto) {
    return this.addProductImage(input);
  }
}
