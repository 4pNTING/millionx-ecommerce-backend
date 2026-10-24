import { Repository } from 'typeorm';
import {
  CatalogCategoryPageModel,
  CatalogCategoryQuery,
} from '../../../../domain/models/category.model';
import { CategoryEntity } from '../../../entities/category.entity';
import { activeStatusValue } from '../../../common/active-status.filter';

export class LoadCatalogCategoriesAction {
  constructor(private readonly repository: Repository<CategoryEntity>) {}

  async execute(filter: CatalogCategoryQuery = {}): Promise<CatalogCategoryPageModel> {
    const page = filter.page ?? 1;
    const limit = filter.limit ?? 20;

    const query = this.repository
      .createQueryBuilder('category')
      .orderBy('category.sortOrder', 'ASC')
      .addOrderBy('category.name', 'ASC');

    if (filter.parentId) {
      query.andWhere('category.parentId = :parentId', { parentId: filter.parentId });
    } else if (filter.rootOnly) {
      query.andWhere('category.parentId IS NULL');
    }

    const keyword = filter.keyword?.trim();
    if (keyword) {
      query.andWhere(
        '(category.name ILIKE :keyword OR category.slug ILIKE :keyword OR category.description ILIKE :keyword)',
        { keyword: `%${keyword}%` },
      );
    }

    const isActive = activeStatusValue(filter.isActive);
    if (isActive !== undefined) {
      query.andWhere('category.isActive = :isActive', { isActive });
    }

    if (!filter.fetchAll) {
      query.skip((page - 1) * limit).take(limit);
    }
    const [items, total] = await query.getManyAndCount();
    return { items, total, page, limit };
  }
}
