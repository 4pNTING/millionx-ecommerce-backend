import {
  CatalogCategoryModel,
  CatalogCategoryPageModel,
  CatalogCategoryQuery,
  CreateCatalogCategoryRequest,
  UpdateCatalogCategoryRequest,
} from '../models/category.model';

export interface ICategoryRepository {
  loadCategories(query?: CatalogCategoryQuery): Promise<CatalogCategoryPageModel>;
  createCategory(input: CreateCatalogCategoryRequest): Promise<CatalogCategoryModel>;
  updateCategory(input: UpdateCatalogCategoryRequest): Promise<CatalogCategoryModel>;
}
