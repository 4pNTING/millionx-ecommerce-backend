export class CategoryModel {
  id: string;
  parentId?: string;
  name: string;
  slug: string;
  description?: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CatalogCategoryModel extends CategoryModel {}

export interface CatalogCategoryPageModel {
  items: CatalogCategoryModel[];
  total: number;
  page: number;
  limit: number;
}

export interface CatalogCategoryQuery {
  parentId?: string;
  keyword?: string;
  page?: number;
  limit?: number;
  isActive?: boolean;
  includeInactive?: boolean;
  rootOnly?: boolean;
  fetchAll?: boolean;
}

export interface CreateCatalogCategoryRequest {
  parentId?: string;
  name: string;
  slug: string;
  description?: string;
  sortOrder?: number;
}

export interface UpdateCatalogCategoryRequest extends Partial<CreateCatalogCategoryRequest> {
  id: string;
  isActive?: boolean;
}
