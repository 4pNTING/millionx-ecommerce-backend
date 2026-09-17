import { CreateCatalogProductBundleRequest } from '../../domain/models/product.model';
import { IProductRepository } from '../../domain/repositories/product.repository.interface';

export class CreateCatalogProductBundleUseCase {
  constructor(private readonly repository: IProductRepository) {}

  execute(input: CreateCatalogProductBundleRequest) {
    return this.repository.createProductBundle(input);
  }
}
