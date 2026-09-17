import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, QueryRunner, Repository } from 'typeorm';
import {
  CatalogProductModel,
  CatalogProductPageModel,
  CatalogProductQuery,
  CreateCatalogProductBundleRequest,
  CreateCatalogProductRequest,
  UpdateCatalogProductRequest,
} from '../../../domain/models/product.model';
import {
  CatalogVariantModel,
  CreateCatalogVariantRequest,
} from '../../../domain/models/product-variant.model';
import { SetCatalogProductPriceRequest } from '../../../domain/models/product-price.model';
import {
  AddCatalogProductImageRequest,
  DeleteCatalogProductImageRequest,
  UpdateCatalogProductImageRequest,
} from '../../../domain/models/product-image.model';
import { IProductRepository } from '../../../domain/repositories/product.repository.interface';
import { RedisService } from '../../cache/redis.service';
import { CategoryEntity } from '../../entities/category.entity';
import { ProductEntity } from '../../entities/product.entity';
import { ProductImageEntity } from '../../entities/product-image.entity';
import { ProductPriceEntity } from '../../entities/product-price.entity';
import { ProductVariantEntity } from '../../entities/product-variant.entity';
import { AddCatalogProductImageAction } from './addImage/addImage.action';
import { AddCatalogProductImageValidation } from './addImage/addImage.validation';
import { CatalogProductMapper } from './catalog-product.mapper';
import { CreateCatalogProductAction } from './createProduct/createProduct.action';
import { CreateCatalogProductValidation } from './createProduct/createProduct.validation';
import { CreateCatalogProductBundleAction } from './createProductBundle/createProductBundle.action';
import { CreateCatalogProductBundleValidation } from './createProductBundle/createProductBundle.validation';
import { CreateCatalogVariantAction } from './createVariant/createVariant.action';
import { CreateCatalogVariantValidation } from './createVariant/createVariant.validation';
import { DeleteCatalogProductImageAction } from './deleteImage/deleteImage.action';
import { DeleteCatalogProductImageValidation } from './deleteImage/deleteImage.validation';
import { LoadCatalogProductAction } from './loadProduct/loadProduct.action';
import { LoadCatalogProductValidation } from './loadProduct/loadProduct.validation';
import { LoadCatalogProductsAction } from './loadProducts/loadProducts.action';
import { LoadCatalogProductsValidation } from './loadProducts/loadProducts.validation';
import { SetCatalogProductPriceAction } from './setPrice/setPrice.action';
import { SetCatalogProductPriceValidation } from './setPrice/setPrice.validation';
import { UpdateCatalogProductAction } from './updateProduct/updateProduct.action';
import { UpdateCatalogProductValidation } from './updateProduct/updateProduct.validation';
import { UpdateCatalogProductImageAction } from './updateImage/updateImage.action';
import { UpdateCatalogProductImageValidation } from './updateImage/updateImage.validation';

@Injectable()
export class DatabaseProductRepository implements IProductRepository {
  private readonly productMapper: CatalogProductMapper;

  constructor(
    @InjectRepository(ProductEntity)
    private readonly productEntity: Repository<ProductEntity>,
    @InjectRepository(ProductVariantEntity)
    private readonly variantEntity: Repository<ProductVariantEntity>,
    @InjectRepository(ProductPriceEntity)
    private readonly priceEntity: Repository<ProductPriceEntity>,
    @InjectRepository(ProductImageEntity)
    private readonly imageEntity: Repository<ProductImageEntity>,
    private readonly dataSource: DataSource,
    private readonly redisService: RedisService,
  ) {
    this.productMapper = new CatalogProductMapper(
      this.variantEntity,
      this.priceEntity,
      this.imageEntity,
    );
  }

  async loadProducts(filter: CatalogProductQuery = {}): Promise<CatalogProductPageModel> {
    const normalized = new LoadCatalogProductsValidation().execute(filter);
    const key = `catalog:products:${JSON.stringify(normalized.cacheKey)}`;
    const cached = await this.redisService.get<CatalogProductPageModel>(key);
    if (cached) return cached;

    const result = await new LoadCatalogProductsAction(
      this.productEntity,
      this.productMapper,
    ).execute(normalized.filter, normalized.page, normalized.limit, normalized.currency);
    await this.redisService.set(key, result, 120);
    return result;
  }

  async loadProduct(id?: string, slug?: string, currency?: string): Promise<CatalogProductModel> {
    const validated = await new LoadCatalogProductValidation(this.productEntity).execute(
      id,
      slug,
      currency,
    );
    const key = `catalog:product:${id ?? slug}:${validated.currency ?? 'all'}`;
    const cached = await this.redisService.get<CatalogProductModel>(key);
    if (cached) return cached;

    const result = await new LoadCatalogProductAction(this.productMapper).execute(
      validated.product,
      validated.currency,
    );
    await this.redisService.set(key, result, 120);
    return result;
  }

  async createProduct(input: CreateCatalogProductRequest): Promise<CatalogProductModel> {
    const product = await this.runTransaction(async (session) => {
      await new CreateCatalogProductValidation(
        session.manager.getRepository(CategoryEntity),
        session.manager.getRepository(ProductEntity),
      ).execute(input);
      return new CreateCatalogProductAction(session).execute(input);
    });
    await this.clearCache();
    return (await this.productMapper.hydrateProducts([product]))[0];
  }

  async createProductBundle(
    input: CreateCatalogProductBundleRequest,
  ): Promise<CatalogProductModel> {
    new CreateCatalogProductBundleValidation().execute(input);
    const product = await this.runTransaction((session) =>
      new CreateCatalogProductBundleAction(session).execute(input),
    );
    await this.clearCache();
    return (await this.productMapper.hydrateProducts([product]))[0];
  }

  async updateProduct(input: UpdateCatalogProductRequest): Promise<CatalogProductModel> {
    const product = await this.runTransaction(async (session) => {
      const validatedProduct = await new UpdateCatalogProductValidation(
        session.manager.getRepository(CategoryEntity),
        session.manager.getRepository(ProductEntity),
        session.manager.getRepository(ProductVariantEntity),
        session.manager.getRepository(ProductPriceEntity),
        session.manager.getRepository(ProductImageEntity),
      ).execute(input);
      return new UpdateCatalogProductAction(session).execute(validatedProduct, input);
    });
    await this.clearCache();
    return (await this.productMapper.hydrateProducts([product]))[0];
  }

  async createVariant(input: CreateCatalogVariantRequest): Promise<CatalogVariantModel> {
    const variant = await this.runTransaction(async (session) => {
      const validated = await new CreateCatalogVariantValidation(
        session.manager.getRepository(ProductEntity),
        session.manager.getRepository(ProductVariantEntity),
      ).execute(input);
      return new CreateCatalogVariantAction(session).execute(input, validated.attributes);
    });
    await this.clearCache();
    return this.productMapper.mapVariant(variant, []);
  }

  async setPrice(input: SetCatalogProductPriceRequest): Promise<CatalogProductModel> {
    const result = await this.runTransaction(async (session) => {
      const validated = await new SetCatalogProductPriceValidation(
        session.manager.getRepository(ProductVariantEntity),
      ).execute(input);
      return new SetCatalogProductPriceAction(session).execute(input, validated);
    });
    await this.clearCache();
    return this.loadProduct(result.productId, undefined, result.currency);
  }

  async addImage(input: AddCatalogProductImageRequest): Promise<CatalogProductModel> {
    const productId = await this.runTransaction(async (session) => {
      await new AddCatalogProductImageValidation(
        session.manager.getRepository(ProductEntity),
        session.manager.getRepository(ProductVariantEntity),
      ).execute(input);
      return new AddCatalogProductImageAction(session).execute(input);
    });
    await this.clearCache();
    return this.hydrateProductById(productId);
  }

  async updateImage(input: UpdateCatalogProductImageRequest): Promise<CatalogProductModel> {
    const productId = await this.runTransaction(async (session) => {
      const image = await new UpdateCatalogProductImageValidation(
        session.manager.getRepository(ProductImageEntity),
        session.manager.getRepository(ProductVariantEntity),
      ).execute(input);
      return new UpdateCatalogProductImageAction(session).execute(image, input);
    });
    await this.clearCache();
    return this.hydrateProductById(productId);
  }

  async deleteImage(input: DeleteCatalogProductImageRequest): Promise<CatalogProductModel> {
    const productId = await this.runTransaction(async (session) => {
      const image = await new DeleteCatalogProductImageValidation(
        session.manager.getRepository(ProductImageEntity),
      ).execute(input);
      return new DeleteCatalogProductImageAction(session).execute(image);
    });
    await this.clearCache();
    return this.hydrateProductById(productId);
  }

  private async runTransaction<T>(work: (session: QueryRunner) => Promise<T>): Promise<T> {
    const session = this.dataSource.createQueryRunner();
    await session.connect();
    await session.startTransaction();
    try {
      const result = await work(session);
      await session.commitTransaction();
      return result;
    } catch (error) {
      await session.rollbackTransaction();
      throw error;
    } finally {
      await session.release();
    }
  }

  private async hydrateProductById(productId: string): Promise<CatalogProductModel> {
    const product = await this.productEntity.findOneOrFail({ where: { id: productId } });
    return (await this.productMapper.hydrateProducts([product]))[0];
  }

  private clearCache(): Promise<void> {
    return this.redisService.delByPattern('catalog:*');
  }
}
