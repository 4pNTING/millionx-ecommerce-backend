import { IProductRepository } from '../../domain/repositories/product.repository.interface';

export class LoadCatalogProductUseCase {
  constructor(private readonly repository: IProductRepository) {}
  execute(_id?: string, slug?: string, currency?: string) {
    return this.repository.loadProduct(_id, slug, currency);
  }
}
