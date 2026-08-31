import { UpdateCatalogCategoryRequest } from '../../domain/models/category.model';
import { ICategoryRepository } from '../../domain/repositories/category.repository.interface';

export class UpdateCatalogCategoryUseCase {
  constructor(private readonly repository: ICategoryRepository) {}
  execute(input: UpdateCatalogCategoryRequest) {
    return this.repository.updateCategory(input);
  }
}
