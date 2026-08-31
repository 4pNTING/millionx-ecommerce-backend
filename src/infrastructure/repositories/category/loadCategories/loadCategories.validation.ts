import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { CatalogCategoryQuery } from '../../../../domain/models/category.model';
import { CategoryEntity } from '../../../entities/category.entity';

export interface NormalizedCatalogCategoryQuery {
  filter: CatalogCategoryQuery;
  page: number;
  limit: number;
  cacheKey: CatalogCategoryQuery;
}

export class LoadCatalogCategoriesValidation {
  constructor(private readonly repository: Repository<CategoryEntity>) {}

  async execute(filter: CatalogCategoryQuery): Promise<NormalizedCatalogCategoryQuery> {
    const page = filter.page ?? 1;
    const limit = filter.limit ?? 20;

    if (page < 1) throw new BadRequestException('page must be greater than 0');
    if (limit < 1 || limit > 100) {
      throw new BadRequestException('limit must be between 1 and 100');
    }

    if (filter.parentId) {
      const parent = await this.repository.findOne({ where: { id: filter.parentId } });
      if (!parent) throw new NotFoundException('Parent category not found');
    }

    const keyword = filter.keyword?.trim();
    const normalizedFilter = { ...filter, keyword: keyword || undefined, page, limit };
    return {
      filter: normalizedFilter,
      page,
      limit,
      cacheKey: normalizedFilter,
    };
  }
}
