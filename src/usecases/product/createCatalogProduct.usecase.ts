import { CreateCatalogProductRequest } from '../../domain/models/product.model';
import { IProductRepository } from '../../domain/repositories/product.repository.interface';

export class CreateCatalogProductUseCase {
  constructor(private readonly repository: IProductRepository) {}
  execute(input: CreateCatalogProductRequest) {
    return this.repository.createProduct(input);
  }
}
