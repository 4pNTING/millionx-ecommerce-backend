import { QueryRunner } from 'typeorm';
import {
  CatalogCategoryModel,
  UpdateCatalogCategoryRequest,
} from '../../../../domain/models/category.model';
import { CategoryEntity } from '../../../entities/category.entity';

export class UpdateCatalogCategoryAction {
  constructor(private readonly session: QueryRunner) {}

  async execute(
    category: CategoryEntity,
    input: UpdateCatalogCategoryRequest,
  ): Promise<CatalogCategoryModel> {
    Object.assign(category, input);
    return this.session.manager.getRepository(CategoryEntity).save(category);
  }
}
