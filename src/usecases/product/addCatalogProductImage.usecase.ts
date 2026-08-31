import { AddCatalogProductImageRequest } from '../../domain/models/product-image.model';
import { IProductRepository } from '../../domain/repositories/product.repository.interface';

export class AddCatalogProductImageUseCase {
  constructor(private readonly repository: IProductRepository) {}
  execute(input: AddCatalogProductImageRequest) {
    return this.repository.addImage(input);
  }
}
