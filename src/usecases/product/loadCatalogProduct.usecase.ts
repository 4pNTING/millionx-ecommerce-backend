import { IProductRepository } from '../../domain/repositories/product.repository.interface';

export class LoadCatalogProductUseCase {
  constructor(private readonly repository: IProductRepository) {}
  execute(id?: string, slug?: string, currency?: string) {
    return this.repository.loadProduct(id, slug, currency);
  }
}
