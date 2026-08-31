import { Repository } from 'typeorm';
import {
  CatalogProductPageModel,
  CatalogProductQuery,
} from '../../../../domain/models/product.model';
import { ProductEntity } from '../../../entities/product.entity';
import { CatalogProductMapper } from '../catalog-product.mapper';

export class LoadCatalogProductsAction {
  constructor(
    private readonly repository: Repository<ProductEntity>,
    private readonly mapper: CatalogProductMapper,
  ) {}

  async execute(
    filter: CatalogProductQuery,
    page: number,
    limit: number,
    currency?: string,
  ): Promise<CatalogProductPageModel> {
    const query = this.repository.createQueryBuilder('product');
    if (!filter.includeInactive) query.andWhere('product.isActive = true');
    if (filter.categoryId) {
      query.andWhere('product.categoryId = :categoryId', { categoryId: filter.categoryId });
    }
    if (filter.keyword?.trim()) {
      query.andWhere(
        '(product.name ILIKE :keyword OR product.slug ILIKE :keyword OR product.brand ILIKE :keyword)',
        { keyword: `%${filter.keyword.trim()}%` },
      );
    }
    query
      .orderBy('product.createdAt', 'DESC')
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
