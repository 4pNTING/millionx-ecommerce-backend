import { CatalogProductQuery } from '../../domain/models/product.model';
import { IProductRepository } from '../../domain/repositories/product.repository.interface';

export class LoadCatalogProductsUseCase {
  constructor(private readonly repository: IProductRepository) {}
  execute(query?: CatalogProductQuery) {
    return this.repository.loadProducts(query);
  }
}
