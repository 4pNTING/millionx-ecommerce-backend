import { CatalogCategoryQuery } from '../../domain/models/category.model';
import { ICategoryRepository } from '../../domain/repositories/category.repository.interface';

export class LoadCatalogCategoriesUseCase {
  constructor(private readonly repository: ICategoryRepository) {}
  execute(query?: CatalogCategoryQuery) {
    return this.repository.loadCategories(query);
  }
}
