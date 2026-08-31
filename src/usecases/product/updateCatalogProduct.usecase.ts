import { UpdateCatalogProductRequest } from '../../domain/models/product.model';
import { IProductRepository } from '../../domain/repositories/product.repository.interface';

export class UpdateCatalogProductUseCase {
  constructor(private readonly repository: IProductRepository) {}
  execute(input: UpdateCatalogProductRequest) {
    return this.repository.updateProduct(input);
  }
}
