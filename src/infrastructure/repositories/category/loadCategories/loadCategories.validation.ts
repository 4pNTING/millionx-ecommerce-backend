import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { CatalogCategoryQuery } from '../../../../domain/models/category.model';
import { CategoryEntity } from '../../../entities/category.entity';

export class LoadCatalogCategoriesValidation {
  constructor(private readonly repository: Repository<CategoryEntity>) {}

  async execute(filter: CatalogCategoryQuery = {}): Promise<void> {
    const page = filter.page;
    const limit = filter.limit;

    if (page != null && page < 1) throw new BadRequestException('page must be greater than 0');
    if (limit != null && (limit < 1 || limit > 100)) {
      throw new BadRequestException('limit must be between 1 and 100');
    }

    if (filter.parentId) {
      const parent = await this.repository.findOne({ where: { id: filter.parentId } });
      if (!parent) throw new NotFoundException('Parent category not found');
    }
  }
}
