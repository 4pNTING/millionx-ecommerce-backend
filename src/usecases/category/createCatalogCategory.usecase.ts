import { CreateCatalogCategoryRequest } from '../../domain/models/category.model';
import { ICategoryRepository } from '../../domain/repositories/category.repository.interface';

export class CreateCatalogCategoryUseCase {
  constructor(private readonly repository: ICategoryRepository) {}
  execute(input: CreateCatalogCategoryRequest) {
    return this.repository.createCategory(input);
  }
}
