import { CatalogProductModel } from '../../../../domain/models/product.model';
import { ProductEntity } from '../../../entities/product.entity';
import { CatalogProductMapper } from '../catalog-product.mapper';

export class LoadCatalogProductAction {
  constructor(private readonly mapper: CatalogProductMapper) {}

  async execute(product: ProductEntity, currency?: string): Promise<CatalogProductModel> {
    return (await this.mapper.hydrateProducts([product], currency))[0];
  }
}
