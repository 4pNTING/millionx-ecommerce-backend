import { Repository } from 'typeorm';
import {
  CatalogProductPageModel,
  CatalogProductQuery,
} from '../../../../domain/models/product.model';
import { ProductEntity } from '../../../entities/product.entity';
import { CategoryEntity } from '../../../entities/category.entity';
import { categorySubtreeQuery } from '../../category/category-subtree.query';
import { CatalogProductMapper } from '../catalog-product.mapper';
import { activeStatusValue } from '../../../common/active-status.filter';

export class LoadCatalogProductsAction {
  constructor(
    private readonly repository: Repository<ProductEntity>,
    private readonly mapper: CatalogProductMapper,
  ) {}

  async execute(filter: CatalogProductQuery = {}): Promise<CatalogProductPageModel> {
    const page = filter.page ?? 1;
    const limit = filter.limit ?? 20;
    const currency = filter.currency?.trim().toUpperCase();

    const query = this.repository.createQueryBuilder('product');
    const isActive = activeStatusValue(filter.isActive);
    if (isActive !== undefined) query.andWhere('product.isActive = :isActive', { isActive });
    if (filter.categoryId) {
      if (filter.includeDescendants) {
        query
          .addCommonTableExpression(
            categorySubtreeQuery(this.repository.manager.getRepository(CategoryEntity)),
            'category_subtree',
            { recursive: true },
          )
          .andWhere('product.categoryId IN (SELECT _id FROM "category_subtree")', {
            subtreeRootId: filter.categoryId,
          });
      } else {
        query.andWhere('product.categoryId = :categoryId', { categoryId: filter.categoryId });
      }
    }
    const keyword = filter.keyword?.trim();
    if (keyword) {
      query.andWhere(
        '(product.name ILIKE :keyword OR product.slug ILIKE :keyword OR product.brand ILIKE :keyword)',
        { keyword: `%${keyword}%` },
      );
    }
    query
      .orderBy('product.createdAt', 'DESC')
      .addOrderBy('product._id', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);
    const [products, total] = await query.getManyAndCount();
    return {
      items: await this.mapper.hydrateProducts(products, currency),
      total,
      page,
      limit,
    };
  }
}
