import { QueryRunner } from 'typeorm';
import {
  CatalogCategoryModel,
  CreateCatalogCategoryRequest,
} from '../../../../domain/models/category.model';
import { CategoryEntity } from '../../../entities/category.entity';

export class CreateCatalogCategoryAction {
  constructor(private readonly session: QueryRunner) {}

  async execute(input: CreateCatalogCategoryRequest): Promise<CatalogCategoryModel> {
    const repository = this.session.manager.getRepository(CategoryEntity);
    return repository.save(repository.create(input));
  }
}
