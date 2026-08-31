import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, QueryRunner, Repository } from 'typeorm';
import {
  CatalogCategoryModel,
  CatalogCategoryPageModel,
  CatalogCategoryQuery,
  CreateCatalogCategoryRequest,
  UpdateCatalogCategoryRequest,
} from '../../../domain/models/category.model';
import { ICategoryRepository } from '../../../domain/repositories/category.repository.interface';
import { RedisService } from '../../cache/redis.service';
import { CategoryEntity } from '../../entities/category.entity';
import { CreateCatalogCategoryAction } from './createCategory/createCategory.action';
import { CreateCatalogCategoryValidation } from './createCategory/createCategory.validation';
import { LoadCatalogCategoriesAction } from './loadCategories/loadCategories.action';
import { LoadCatalogCategoriesValidation } from './loadCategories/loadCategories.validation';
import { UpdateCatalogCategoryAction } from './updateCategory/updateCategory.action';
import { UpdateCatalogCategoryValidation } from './updateCategory/updateCategory.validation';

@Injectable()
export class DatabaseCategoryRepository implements ICategoryRepository {
  constructor(
    @InjectRepository(CategoryEntity)
    private readonly categoryEntity: Repository<CategoryEntity>,
    private readonly dataSource: DataSource,
    private readonly redisService: RedisService,
  ) {}

  async loadCategories(filter: CatalogCategoryQuery = {}): Promise<CatalogCategoryPageModel> {
    const normalized = await new LoadCatalogCategoriesValidation(this.categoryEntity).execute(
      filter,
    );
    const key = `catalog:categories:${JSON.stringify(normalized.cacheKey)}`;
    const cached = await this.redisService.get<CatalogCategoryPageModel>(key);
    if (cached) return cached;

    const result = await new LoadCatalogCategoriesAction(this.categoryEntity).execute(
      normalized.filter,
      normalized.page,
      normalized.limit,
    );
    await this.redisService.set(key, result, 300);
    return result;
  }

  async createCategory(input: CreateCatalogCategoryRequest): Promise<CatalogCategoryModel> {
    const result = await this.runTransaction(async (session) => {
      const repository = session.manager.getRepository(CategoryEntity);
      await new CreateCatalogCategoryValidation(repository).execute(input);
      return new CreateCatalogCategoryAction(session).execute(input);
    });
    await this.clearCache();
    return result;
  }

  async updateCategory(input: UpdateCatalogCategoryRequest): Promise<CatalogCategoryModel> {
    const result = await this.runTransaction(async (session) => {
      const repository = session.manager.getRepository(CategoryEntity);
      const category = await new UpdateCatalogCategoryValidation(repository).execute(input);
      return new UpdateCatalogCategoryAction(session).execute(category, input);
    });
    await this.clearCache();
    return result;
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

  private clearCache(): Promise<void> {
    return this.redisService.delByPattern('catalog:*');
  }
}
